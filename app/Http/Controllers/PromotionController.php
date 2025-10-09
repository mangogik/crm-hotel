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
use Illuminate\Validation\ValidationException;
use Throwable;

class PromotionController extends Controller
{
    /**
     * LIST + FILTER + PAGINATION
     */
    public function index(Request $request)
    {
        // Initialize variables with defaults (RAW)
        $perPage       = (int) $request->input('per_page', 10);
        $search        = trim((string) $request->input('search', ''));
        $rawType       = $request->input('type');   // bisa null karena ConvertEmptyStringsToNull
        $rawActive     = $request->input('active'); // bisa null
        $sortBy        = $request->input('sort_by', 'created_at');
        $sortDirection = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        // NORMALISASI: null / '' / 'all' => tidak difilter (null)
        $type   = in_array($rawType,   [null, '', 'all'], true) ? null : $rawType;
        $active = in_array($rawActive, [null, '', 'all'], true) ? null : $rawActive;

        // Validate sort field
        $allowedSorts = ['created_at', 'name', 'type', 'active'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }

        // Create base query with usages_count
        $query = Promotion::query()
            ->with(['services:id,name,price', 'freeService:id,name'])
            ->withCount('usages'); // This is needed for individual promotion usage count

        // Apply search filter
        if ($search !== '') {
            $query->where(function ($qq) use ($search) {
                $qq->where('name', 'like', "%{$search}%")
                    ->orWhere('event_code', 'like', "%{$search}%")
                    ->orWhere('membership_tier', 'like', "%{$search}%");
            });
        }

        // Apply type filter (only if not null)
        if (!is_null($type)) {
            $query->where('type', $type);
        }

        // Apply active filter (only if not null)
        if (!is_null($active)) {
            // terima '1'/'0' (string) atau true/false (bool/int)
            $activeValue = in_array($active, [1, '1', true], true);
            $query->where('active', $activeValue);
        }

        // Apply ordering
        $query->orderBy($sortBy, $sortDirection);

        // Execute pagination
        $promotions = $query->paginate($perPage)->withQueryString();

        // Calculate stats - using promotions_used table for total usage
        $totalUsage = PromotionUsed::count();
        $stats = [
            'total'       => Promotion::count(),
            'active'      => Promotion::where('active', true)->count(),
            'usage'       => $totalUsage,
        ];

        // Get services for modal checklist
        $services = Service::select('id', 'name', 'price')->orderBy('name')->get();

        // Prepare filters for response (user-friendly)
        $filters = [
            'search'         => $search,
            'type'           => $type   ?? 'all',
            'active'         => is_null($active) ? 'all' : ($active ? '1' : '0'),
            'per_page'       => $perPage,
            'sort_by'        => $sortBy,
            'sort_direction' => $sortDirection,
        ];

        // Return response
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

    /**
     * CREATE
     * Kolom yang kita dukung: name, type, active, discount_percent, discount_amount,
     * free_service_id, free_service_qty, birthday_days_before, membership_tier, event_code, service_ids[]
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'   => ['required', 'string', 'max:150'],
            'type'   => ['required', Rule::in(['birthday', 'event', 'membership'])],
            'active' => ['boolean'],

            // Action (pilih salah satu yang terisi)
            'discount_percent' => ['nullable', 'integer', 'min:1', 'max:100'],
            'discount_amount'  => ['nullable', 'numeric', 'min:0'],
            'free_service_id'  => ['nullable', 'exists:services,id'],
            'free_service_qty' => ['nullable', 'integer', 'min:1'],

            // Params
            'birthday_days_before' => ['nullable', 'integer', 'min:0', 'max:31'],
            'membership_tier'      => ['nullable', 'string', 'max:50'],
            'event_code'           => ['nullable', 'string', 'max:100'],

            // Scope layanan khusus (opsional)
            'service_ids' => ['array'],
            'service_ids.*' => ['integer', 'exists:services,id'],
        ]);

        // Pastikan ada salah satu aksi diisi
        if (
            empty($validated['discount_percent']) &&
            empty($validated['discount_amount']) &&
            empty($validated['free_service_id'])
        ) {
            return back()->with('error', 'Please set at least one action: discount percent/amount or a free service.');
        }

        // Defaulting ringan
        $validated['active'] = $validated['active'] ?? true;
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

    /**
     * UPDATE
     */
    public function update(Request $request, Promotion $promotion)
    {
        $validated = $request->validate([
            'name'   => ['required', 'string', 'max:150'],
            'type'   => ['required', Rule::in(['birthday', 'event', 'membership'])],
            'active' => ['boolean'],

            'discount_percent' => ['nullable', 'integer', 'min:1', 'max:100'],
            'discount_amount'  => ['nullable', 'numeric', 'min:0'],
            'free_service_id'  => ['nullable', 'exists:services,id'],
            'free_service_qty' => ['nullable', 'integer', 'min:1'],

            'birthday_days_before' => ['nullable', 'integer', 'min:0', 'max:31'],
            'membership_tier'      => ['nullable', 'string', 'max:50'],
            'event_code'           => ['nullable', 'string', 'max:100'],

            'service_ids' => ['array'],
            'service_ids.*' => ['integer', 'exists:services,id'],
        ]);

        if (
            empty($validated['discount_percent']) &&
            empty($validated['discount_amount']) &&
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

        DB::transaction(function () use ($promotion, $validated) {
            $serviceIds = $validated['service_ids'] ?? [];
            unset($validated['service_ids']);

            $promotion->update($validated);
            $promotion->services()->sync($serviceIds);
        });

        return back()->with('success', 'Promotion updated.');
    }

    /**
     * QUICK TOGGLE ACTIVE
     */
    public function toggle(Promotion $promotion)
    {
        $promotion->active = !$promotion->active;
        $promotion->save();

        return back()->with('success', 'Promotion status updated.');
    }

    /**
     * DELETE
     */
    public function destroy(Promotion $promotion)
    {
        $promotion->delete();
        return back()->with('success', 'Promotion deleted.');
    }

    public function checkEligibility(Request $request)
    {
        Log::info('[promotions.checkEligibility] START', [
            'raw'     => $request->all(),
            'user_id' => optional($request->user())->id,
        ]);

        try {
            $validated = $request->validate([
                'customer_id'   => ['required', 'exists:customers,id'],
                'service_ids'   => ['required', 'array', 'min:1'],
                'service_ids.*' => ['integer', 'exists:services,id'],
                'date'          => ['nullable', 'date'], // optional (default today)
                // event_code sengaja diabaikan, tidak perlu lagi
            ]);

            $customerId = (int) $validated['customer_id'];
            $serviceIds = array_values(array_map('intval', $validated['service_ids']));
            $asOf       = !empty($validated['date']) ? Carbon::parse($validated['date']) : now();

            Log::info('[promotions.checkEligibility] Normalized input', [
                'customer_id' => $customerId,
                'service_ids' => $serviceIds,
                'as_of_iso'   => $asOf->toIso8601String(),
            ]);

            /** @var \App\Models\Customer $customer */
            $customer = Customer::with('membership')->findOrFail($customerId);

            Log::info('[promotions.checkEligibility] Customer snapshot', [
                'id'              => $customer->id,
                'name'            => $customer->name,
                'birth_date'      => optional($customer->birth_date)->toDateString(),
                'membership_type' => optional($customer->membership)->membership_type,
            ]);

            $promos = Promotion::query()
                ->active()
                ->with(['services:id', 'freeService:id,name'])
                ->get();

            Log::info('[promotions.checkEligibility] Active promotions fetched', [
                'count' => $promos->count(),
                'ids'   => $promos->pluck('id')->all(),
            ]);

            $eligible = [];

            foreach ($promos as $promo) {
                $logCtx = [
                    'promo_id'  => $promo->id,
                    'name'      => $promo->name,
                    'type'      => $promo->type,
                    'scope_ids' => $promo->services ? $promo->services->pluck('id')->all() : [],
                    'actions'   => [
                        'discount_percent' => $promo->discount_percent,
                        'discount_amount'  => $promo->discount_amount,
                        'free_service_id'  => $promo->free_service_id,
                        'free_service_qty' => $promo->free_service_qty,
                    ],
                ];

                // Scope service (kosong => berlaku untuk semua layanan yang dipilih)
                $scopedIds = $logCtx['scope_ids'];
                $appliesToServices = empty($scopedIds)
                    ? $serviceIds
                    : array_values(array_intersect($serviceIds, $scopedIds));

                if (empty($appliesToServices)) {
                    Log::info('[promotions.checkEligibility] Skip promo (no service overlap)', $logCtx);
                    continue;
                }

                $ok = true;
                $reason = 'OK';

                // === birthday
                if ($promo->type === 'birthday') {
                    if (!$customer->birth_date) {
                        $ok = false;
                        $reason = 'No birth date on customer';
                    } else {
                        $birth = $customer->birth_date instanceof Carbon
                            ? $customer->birth_date->copy()
                            : Carbon::parse($customer->birth_date);

                        $birthdayThisYear = $birth->copy()->year($asOf->year);
                        $diffDays   = $birthdayThisYear->diffInDays($asOf, false);
                        $daysBefore = $promo->birthday_days_before ?? 3;

                        // allow window: N days sebelum ulang tahun s/d hari-H
                        $ok = ($diffDays <= 0) && ($diffDays >= -$daysBefore);
                        if (!$ok) $reason = "Not in birthday window (diffDays={$diffDays}, allowed_before={$daysBefore})";
                    }
                }

                // === membership
                if ($ok && $promo->type === 'membership') {
                    $tier     = optional($customer->membership)->membership_type;
                    $required = $promo->membership_tier;
                    $ok = $tier && $required && strcasecmp($tier, $required) === 0;
                    if (!$ok) $reason = "Membership not matched (have='{$tier}', need='{$required}')";
                }

                // === event
                if ($ok && $promo->type === 'event') {
                    // DULU: wajib cocok event_code → SEKARANG: tidak perlu.
                    // Asal promo aktif + overlap layanan, langsung eligible.
                    // (Kalau nantinya mau window tanggal event, bisa ditambah di sini.)
                }

                if ($ok) {
                    $eligible[] = [
                        'id'                  => $promo->id,
                        'name'                => $promo->name,
                        'type'                => $promo->type,
                        'discount_percent'    => $promo->discount_percent,
                        'discount_amount'     => $promo->discount_amount,
                        'free_service_id'     => $promo->free_service_id,
                        'free_service_qty'    => $promo->free_service_qty ?: 1,
                        'applies_service_ids' => $appliesToServices,
                    ];
                    Log::info('[promotions.checkEligibility] ELIGIBLE', $logCtx + [
                        'applies_to' => $appliesToServices,
                    ]);
                } else {
                    Log::info('[promotions.checkEligibility] NOT eligible', $logCtx + [
                        'reason' => $reason,
                    ]);
                }
            }

            Log::info('[promotions.checkEligibility] RESULT', [
                'eligible_count' => count($eligible),
                'eligible_ids'   => array_column($eligible, 'id'),
            ]);

            return response()->json(['promotions' => $eligible]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            Log::warning('[promotions.checkEligibility] VALIDATION FAILED', [
                'errors' => $ve->errors(),
            ]);
            throw $ve;
        } catch (\Throwable $e) {
            Log::error('[promotions.checkEligibility] ERROR', [
                'ex'    => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Server error while checking eligibility',
            ], 500);
        }
    }
}
