<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Promotion;
use App\Models\Service;
use App\Models\PromotionUsed;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PromotionController extends Controller
{
    /** LIST + FILTER + PAGINATION */
    public function index(Request $request)
    {
        $perPage        = (int) $request->input('per_page', 10);
        $search         = trim((string) $request->input('search', ''));
        $rawType        = $request->input('type');     // null | 'birthday' | 'event' | 'membership'
        $rawActive      = $request->input('active');   // null | '1' | '0'
        $sortBy         = $request->input('sort_by', 'created_at');
        $sortDirection  = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        // Normalisasi
        $type   = in_array($rawType,   [null, '', 'all'], true) ? null : $rawType;
        $active = in_array($rawActive, [null, '', 'all'], true) ? null : $rawActive;

        $allowedSorts = ['created_at', 'name', 'type', 'active'];
        if (!in_array($sortBy, $allowedSorts)) $sortBy = 'created_at';

        $query = Promotion::query()
            ->with(['services:id,name,price', 'freeService:id,name'])
            ->withCount('usages');

        if ($search !== '') {
            $query->where(function ($qq) use ($search) {
                $qq->where('name', 'like', "%{$search}%")
                   ->orWhere('membership_tier', 'like', "%{$search}%");
                // event_code sudah dihapus
            });
        }
        if (!is_null($type))   $query->where('type', $type);
        if (!is_null($active)) {
            $activeValue = in_array($active, [1, '1', true], true);
            $query->where('active', $activeValue);
        }

        $query->orderBy($sortBy, $sortDirection);

        $promotions = $query->paginate($perPage)->withQueryString();

        $totalUsage = PromotionUsed::count();
        $stats = [
            'total'  => Promotion::count(),
            'active' => Promotion::where('active', true)->count(),
            'usage'  => $totalUsage,
        ];

        $services = Service::select('id', 'name', 'price')->orderBy('name')->get();

        $filters = [
            'search'         => $search,
            'type'           => $type   ?? 'all',
            'active'         => is_null($active) ? 'all' : ($active ? '1' : '0'),
            'per_page'       => $perPage,
            'sort_by'        => $sortBy,
            'sort_direction' => $sortDirection,
        ];

        return Inertia::render('Promotions', [
            'promotions' => $promotions,
            'filters'    => $filters,
            'stats'      => $stats,
            'services'   => $services,
            'flash'      => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ]);
    }

    /** CREATE */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'   => ['required', 'string', 'max:150'],
            'type'   => ['required', Rule::in(['birthday', 'event', 'membership'])],
            'active' => ['nullable', 'boolean'], // 0/1

            // Action (pilih salah satu)
            'discount_percent' => ['nullable', 'integer', 'min:1', 'max:100'],
            'discount_amount'  => ['nullable', 'numeric', 'min:0'],
            'free_service_id'  => ['nullable', 'exists:services,id'],
            'free_service_qty' => ['nullable', 'integer', 'min:1'],

            // Params
            'birthday_days_before' => ['nullable', 'integer', 'min:0', 'max:31'],
            'membership_tier'      => ['nullable', 'string', 'max:50'],

            // Scope
            'service_ids'   => ['array'],
            'service_ids.*' => ['integer', 'exists:services,id'],
        ]);

        if (
            empty($validated['discount_percent']) &&
            empty($validated['discount_amount'])  &&
            empty($validated['free_service_id'])
        ) {
            return back()->with('error', 'Please set at least one action: discount percent/amount or a free service.');
        }

        // defaults
        $validated['active'] = array_key_exists('active', $validated)
            ? (bool)$validated['active']
            : true;

        if (!isset($validated['free_service_qty']) && !empty($validated['free_service_id'])) {
            $validated['free_service_qty'] = 1;
        }
        if ($validated['type'] === 'birthday' && !isset($validated['birthday_days_before'])) {
            $validated['birthday_days_before'] = 3;
        }

        DB::transaction(function () use ($validated) {
            $serviceIds = $validated['service_ids'] ?? [];
            unset($validated['service_ids']);

            $promo = Promotion::create($validated);

            if (!empty($serviceIds)) {
                $promo->services()->sync($serviceIds);
            }
        });

        return back()->with('success', 'Promotion created.');
    }

    /** UPDATE */
    public function update(Request $request, Promotion $promotion)
    {
        $validated = $request->validate([
            'name'   => ['required', 'string', 'max:150'],
            'type'   => ['required', Rule::in(['birthday', 'event', 'membership'])],
            'active' => ['nullable', 'boolean'], // 0/1

            'discount_percent' => ['nullable', 'integer', 'min:1', 'max:100'],
            'discount_amount'  => ['nullable', 'numeric', 'min:0'],
            'free_service_id'  => ['nullable', 'exists:services,id'],
            'free_service_qty' => ['nullable', 'integer', 'min:1'],

            'birthday_days_before' => ['nullable', 'integer', 'min:0', 'max:31'],
            'membership_tier'      => ['nullable', 'string', 'max:50'],

            'service_ids'   => ['array'],
            'service_ids.*' => ['integer', 'exists:services,id'],
        ]);

        if (
            empty($validated['discount_percent']) &&
            empty($validated['discount_amount'])  &&
            empty($validated['free_service_id'])
        ) {
            return back()->with('error', 'Please keep at least one action.');
        }

        if (!isset($validated['free_service_qty']) && !empty($validated['free_service_id'])) {
            $validated['free_service_qty'] = 1;
        }
        if ($validated['type'] === 'birthday' && !isset($validated['birthday_days_before'])) {
            $validated['birthday_days_before'] = 3;
        }

        // defaulting untuk kolom active (boolean)
        if (!array_key_exists('active', $validated)) {
            $validated['active'] = $promotion->active; // pertahankan nilai lama
        } else {
            $validated['active'] = (bool)$validated['active'];
        }

        DB::transaction(function () use ($promotion, $validated) {
            $serviceIds = $validated['service_ids'] ?? [];
            unset($validated['service_ids']);

            $promotion->update($validated);
            $promotion->services()->sync($serviceIds);
        });

        return back()->with('success', 'Promotion updated.');
    }

    /** QUICK TOGGLE ACTIVE */
    public function toggle(Promotion $promotion)
    {
        $promotion->active = !$promotion->active;
        $promotion->save();

        return back()->with('success', 'Promotion status updated.');
    }

    /** DELETE */
    public function destroy(Promotion $promotion)
    {
        $promotion->delete();
        return back()->with('success', 'Promotion deleted.');
    }

    /** API: Cek eligibility — tetap tanpa event_code */
    public function checkEligibility(Request $request)
    {
        Log::info('[promotions.checkEligibility] START', [
            'raw'     => $request->all(),
            'user_id' => optional($request->user())->id,
        ]);

        $validated = $request->validate([
            'customer_id'   => ['required', 'exists:customers,id'],
            'service_ids'   => ['required', 'array', 'min:1'],
            'service_ids.*' => ['integer', 'exists:services,id'],
            'date'          => ['nullable', 'date'],
        ]);

        $customerId = (int) $validated['customer_id'];
        $serviceIds = array_values(array_map('intval', $validated['service_ids']));
        $asOf       = !empty($validated['date']) ? Carbon::parse($validated['date']) : now();

        /** @var \App\Models\Customer $customer */
        $customer = Customer::with('membership')->findOrFail($customerId);

        $promos = Promotion::query()
            ->active()
            ->with(['services:id', 'freeService:id,name'])
            ->get();

        $eligible = [];

        foreach ($promos as $promo) {
            $scopedIds = $promo->services ? $promo->services->pluck('id')->all() : [];
            $appliesTo = empty($scopedIds) ? $serviceIds : array_values(array_intersect($serviceIds, $scopedIds));
            if (empty($appliesTo)) continue;

            $ok = true;

            if ($promo->type === 'birthday') {
                if (!$customer->birth_date) $ok = false;
                else {
                    $birth = $customer->birth_date instanceof Carbon
                        ? $customer->birth_date->copy()
                        : Carbon::parse($customer->birth_date);
                    $daysBefore = $promo->birthday_days_before ?? 3;
                    $diffDays   = $birth->copy()->year($asOf->year)->diffInDays($asOf, false);
                    $ok = ($diffDays <= 0) && ($diffDays >= -$daysBefore);
                }
            }

            if ($ok && $promo->type === 'membership') {
                $tier = optional($customer->membership)->membership_type;
                $ok   = $tier && $promo->membership_tier && strcasecmp($tier, $promo->membership_tier) === 0;
            }

            if ($ok) {
                $eligible[] = [
                    'id'                 => $promo->id,
                    'name'               => $promo->name,
                    'type'               => $promo->type,
                    'discount_percent'   => $promo->discount_percent,
                    'discount_amount'    => $promo->discount_amount,
                    'free_service_id'    => $promo->free_service_id,
                    'free_service_qty'   => $promo->free_service_qty ?: 1,
                    'applies_service_ids'=> $appliesTo,
                ];
            }
        }

        return response()->json(['promotions' => $eligible]);
    }
}
