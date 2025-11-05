<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Order;
use App\Models\Service;
use App\Models\Customer;
use App\Models\Promotion;
use App\Models\PromotionUsed;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $search              = $request->input('search');
        $filterStatus        = $request->input('status');
        $filterPaymentMethod = $request->input('payment_preference');
        $filterCountry       = $request->input('country');
        $sortBy              = $request->input('sort_by', 'created_at');
        $sortDirection       = in_array(strtolower($request->input('sort_direction', 'desc')), ['asc', 'desc'])
            ? $request->input('sort_direction', 'desc')
            : 'desc';

        // KPI sederhana berbasis tabel orders
        $paidOrders = Order::with('services')->where('status', 'paid')->get();
        $paidAmountFromOrders = $paidOrders->sum(function ($o) {
            $gt = (float) $o->grand_total;
            if ($gt <= 0) {
                $gt = $o->services->sum(function ($s) {
                    $qty = (float) ($s->pivot->quantity ?? 0);
                    $ppu = (float) ($s->pivot->price_per_unit ?? 0);
                    return $qty * $ppu;
                });
            }
            return $gt;
        });

        $pendingOrders = Order::with('services')->where('status', 'pending')->get();
        $pendingAmountFromOrders = $pendingOrders->sum(function ($o) {
            $gt = (float) $o->grand_total;
            if ($gt <= 0) {
                $gt = $o->services->sum(function ($s) {
                    $qty = (float) ($s->pivot->quantity ?? 0);
                    $ppu = (float) ($s->pivot->price_per_unit ?? 0);
                    return $qty * $ppu;
                });
            }
            return $gt;
        });

        Log::info('[Orders.index][totals_orders_only]', [
            'paid_orders_count'     => $paidOrders->count(),
            'paid_amount'           => $paidAmountFromOrders,
            'pending_orders_count'  => $pendingOrders->count(),
            'pending_amount'        => $pendingAmountFromOrders,
        ]);

        $totals = [
            'total_orders'    => (int) Order::count(),
            'today_orders'    => (int) Order::whereDate('created_at', today())->count(),
            'paid_amount'     => (float) $paidAmountFromOrders,
            'pending_amount'  => (float) $pendingAmountFromOrders,
            'avg_order_value' => (float) Order::avg('grand_total'),
        ];

        $orders = Order::query()
            ->with([
                'customer',
                'services' => function ($q) {
                    $q->select('services.id', 'services.name', 'services.description')
                        ->with(['activeQuestion:id,service_id,questions_json']);
                },
                'payments' => fn($q) => $q->latest(),
                'promotions.services',
            ])
            ->when($filterStatus, fn($q) => $q->where('status', $filterStatus))
            ->when($filterPaymentMethod, fn($q) => $q->where('payment_preference', $filterPaymentMethod))
            ->when($filterCountry, function ($q) use ($filterCountry) {
                $q->whereHas('customer', fn($sub) => $sub->where('passport_country', $filterCountry));
            })
            ->when($search, function ($q) use ($search) {
                $q->whereHas('customer', function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('passport_country', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortBy, $sortDirection)
            ->paginate(10)
            ->withQueryString();

        $customers = Customer::orderBy('name')->get();
        $services  = Service::orderBy('name')->get();

        return Inertia::render('Orders', [
            'orders'    => $orders,
            'customers' => $customers,
            'services'  => $services,
            'filters'   => [
                'search'             => $search,
                'status'             => $filterStatus,
                'payment_preference' => $filterPaymentMethod,
                'country'            => $filterCountry,
                'sort_by'            => $sortBy,
                'sort_direction'     => $sortDirection,
                'per_page'           => 10,
            ],
            'totals' => $totals,
            'flash'  => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        Log::debug('[Order.store] Raw Request Payload', $request->all());

        $validated = $request->validate([
            'customer_id'                      => ['required', 'exists:customers,id'],
            'services'                         => ['required', 'array', 'min:1'],
            'services.*.id'                    => ['required', 'exists:services,id'],
            'services.*.quantity'              => ['nullable', 'numeric', 'min:0'],

            // DETAILS: support single & multi select
            'services.*.details.package'       => ['nullable', 'string'],         // single selectable (legacy)
            'services.*.details.packages'      => ['nullable', 'array', 'min:1'], // multiple options
            'services.*.details.packages.*'    => ['string'],

            // other details
            'services.*.details.weight'        => ['nullable', 'numeric', 'min:0'],
            'services.*.details.answers'       => ['nullable', 'array'],

            'status'                           => ['required', 'string', 'in:pending,paid,cancelled'],
            'payment_preference'               => ['required', 'string', 'in:cash,online'],
            'promotion_id'                     => ['nullable', 'exists:promotions,id'],
            'booking_id'                       => ['nullable', 'exists:bookings,id'],
            'event_code'                       => ['nullable', 'string', 'max:100'],

            // Order-level note (goes to orders.notes)
            'order_notes'                      => ['nullable', 'string', 'max:2000'],
        ]);

        Log::info('[Order.store] START', [
            'payload' => $validated,
            'user_id' => optional($request->user())->id
        ]);

        $customer       = Customer::with('membership')->findOrFail($validated['customer_id']);
        $servicePayload = $validated['services'];

        $lineItems = $this->computeLines($servicePayload);
        $subtotal  = collect($lineItems)->sum(fn($li) => $li['line_total']);

        $discountTotal         = 0.00;
        $promotionUsedPayload  = null;

        if (!empty($validated['promotion_id'])) {
            $promotion = Promotion::with(['services:id'])
                ->active()
                ->findOrFail($validated['promotion_id']);

            $eligible = $this->isPromotionEligibleSimple(
                $promotion,
                $customer,
                collect($lineItems)->pluck('service_id')->all(),
                now()
            );

            if (!$eligible['ok']) {
                return back()
                    ->with('error', 'Selected promotion is not eligible: ' . $eligible['reason'])
                    ->withInput();
            }

            $discountTotal = $this->computeDiscountFromPromotion($promotion, $lineItems, $subtotal);

            $promotionUsedPayload = [
                'promotion_id'     => $promotion->id,
                'discount_applied' => $discountTotal,
                'free_service_id'  => $promotion->free_service_id,
                'free_service_qty' => $promotion->free_service_qty ?: 1,
                'snapshot_json'    => [
                    'promotion'   => $promotion->only([
                        'id',
                        'name',
                        'type',
                        'discount_percent',
                        'discount_amount',
                        'free_service_id',
                        'free_service_qty',
                        'birthday_days_before',
                        'membership_tier',
                        'event_code'
                    ]),
                    'customer'    => $customer->only(['id', 'name', 'birth_date'])
                        + ['membership_type' => optional($customer->membership)->membership_type],
                    'services'    => $lineItems,
                    'computed'    => [
                        'subtotal'        => $subtotal,
                        'discount_total'  => $discountTotal
                    ],
                ],
            ];
        }

        $grandTotal = max($subtotal - $discountTotal, 0);

        $order = DB::transaction(function () use ($validated, $lineItems, $subtotal, $discountTotal, $grandTotal, $promotionUsedPayload) {
            // CREATE ORDER (includes general notes)
            $order = Order::create([
                'customer_id'        => $validated['customer_id'],
                'booking_id'         => $validated['booking_id'] ?? null,
                'payment_preference' => $validated['payment_preference'],
                'status'             => 'pending',
                'subtotal'           => $subtotal,
                'discount_total'     => $discountTotal,
                'grand_total'        => $grandTotal,
                'notes'              => $validated['order_notes'] ?? null,
            ]);

            // ATTACH EACH SERVICE (no pivot notes anymore)
            foreach ($lineItems as $li) {
                $detailsOnlyOptions = $li['details'];

                $order->services()->attach($li['service_id'], [
                    'quantity'       => $li['quantity'],
                    'price_per_unit' => $li['price_per_unit'],
                    'details'        => json_encode($detailsOnlyOptions),
                    'answers_json'   => $li['answers_data'] ? json_encode($li['answers_data']) : null,
                ]);
            }

            // RECORD USED PROMOTION IF ANY
            if ($promotionUsedPayload) {
                PromotionUsed::create([
                    'order_id'         => $order->id,
                    'promotion_id'     => $promotionUsedPayload['promotion_id'],
                    'discount_applied' => $promotionUsedPayload['discount_applied'],
                    'free_service_id'  => $promotionUsedPayload['free_service_id'],
                    'free_service_qty' => $promotionUsedPayload['free_service_qty'],
                    'snapshot_json'    => $promotionUsedPayload['snapshot_json'],
                ]);
            }

            // INITIAL PAYMENT ROW
            Payment::create([
                'order_id' => $order->id,
                'method'   => $validated['payment_preference'],
                'amount'   => $grandTotal,
                'currency' => 'IDR',
                'status'   => 'pending',
            ]);

            Log::info('[Order.store] PERSISTED', [
                'order_id'       => $order->id,
                'subtotal'       => $subtotal,
                'discount_total' => $discountTotal,
                'grand_total'    => $grandTotal,
            ]);

            return $order;
        });

        return redirect()->back()->with('success', 'Order baru berhasil dibuat.');
    }

    public function update(Request $request, Order $order)
    {
        $validated = $request->validate([
            'customer_id'                => ['required', 'exists:customers,id'],
            'services'                   => ['required', 'array', 'min:1'],
            'services.*.id'              => ['required', 'exists:services,id'],
            'services.*.quantity'        => ['nullable', 'numeric', 'min:0'],

            // DETAILS: support single & multi select
            'services.*.details.package'    => ['nullable', 'string'],
            'services.*.details.packages'   => ['nullable', 'array', 'min:1'],
            'services.*.details.packages.*' => ['string'],

            // other details
            'services.*.details.weight'     => ['nullable', 'numeric', 'min:0'],
            'services.*.details.answers'    => ['nullable', 'array'],

            'status'                        => ['required', 'string', 'in:pending,paid,cancelled'],
            'payment_preference'            => ['required', 'string', 'in:cash,online'],
            'promotion_id'                  => ['nullable', 'exists:promotions,id'],
            'booking_id'                    => ['nullable', 'exists:bookings,id'],
            'event_code'                    => ['nullable', 'string', 'max:100'],

            // Order-level note (still allowed on update)
            'order_notes'                   => ['nullable', 'string', 'max:2000'],
        ]);

        Log::info('[Order.update] START', [
            'order_id' => $order->id,
            'payload'  => $validated,
            'user_id'  => optional($request->user())->id
        ]);

        $customer       = Customer::with('membership')->findOrFail($validated['customer_id']);
        $servicePayload = $validated['services'];

        $lineItems = $this->computeLines($servicePayload);
        $subtotal  = collect($lineItems)->sum(fn($li) => $li['line_total']);

        $discountTotal        = 0.00;
        $promotionUsedPayload = null;

        if (!empty($validated['promotion_id'])) {
            $promotion = Promotion::with(['services:id'])
                ->active()
                ->findOrFail($validated['promotion_id']);

            $eligible = $this->isPromotionEligibleSimple(
                $promotion,
                $customer,
                collect($lineItems)->pluck('service_id')->all(),
                now()
            );

            if (!$eligible['ok']) {
                return back()
                    ->with('error', 'Selected promotion is not eligible: ' . $eligible['reason'])
                    ->withInput();
            }

            $discountTotal = $this->computeDiscountFromPromotion($promotion, $lineItems, $subtotal);

            $promotionUsedPayload = [
                'promotion_id'     => $promotion->id,
                'discount_applied' => $discountTotal,
                'free_service_id'  => $promotion->free_service_id,
                'free_service_qty' => $promotion->free_service_qty ?: 1,
                'snapshot_json'    => [
                    'promotion'   => $promotion->only([
                        'id',
                        'name',
                        'type',
                        'discount_percent',
                        'discount_amount',
                        'free_service_id',
                        'free_service_qty',
                        'birthday_days_before',
                        'membership_tier',
                        'event_code'
                    ]),
                    'customer'    => $customer->only(['id', 'name', 'birth_date'])
                        + ['membership_type' => optional($customer->membership)->membership_type],
                    'services'    => $lineItems,
                    'computed'    => [
                        'subtotal'        => $subtotal,
                        'discount_total'  => $discountTotal
                    ],
                ],
            ];
        }

        $grandTotal = max($subtotal - $discountTotal, 0);

        DB::transaction(function () use ($order, $validated, $lineItems, $subtotal, $discountTotal, $grandTotal, $promotionUsedPayload) {

            // UPDATE ORDER (includes general notes)
            $order->update([
                'customer_id'        => $validated['customer_id'],
                'booking_id'         => $validated['booking_id'] ?? null,
                'payment_preference' => $validated['payment_preference'],
                'status'             => $validated['status'],
                'subtotal'           => $subtotal,
                'discount_total'     => $discountTotal,
                'grand_total'        => $grandTotal,
                'notes'              => $validated['order_notes'] ?? null,
            ]);

            // RESET LINE ITEMS then ATTACH AGAIN (still no pivot notes)
            $order->services()->detach();
            foreach ($lineItems as $li) {
                $detailsOnlyOptions = $li['details'];

                $order->services()->attach($li['service_id'], [
                    'quantity'       => $li['quantity'],
                    'price_per_unit' => $li['price_per_unit'],
                    'details'        => json_encode($detailsOnlyOptions),
                    'answers_json'   => $li['answers_data'] ? json_encode($li['answers_data']) : null,
                ]);
            }

            // PROMOTIONS USED
            $order->promotionsUsed()->delete();
            if ($promotionUsedPayload) {
                PromotionUsed::create([
                    'order_id'         => $order->id,
                    'promotion_id'     => $promotionUsedPayload['promotion_id'],
                    'discount_applied' => $promotionUsedPayload['discount_applied'],
                    'free_service_id'  => $promotionUsedPayload['free_service_id'],
                    'free_service_qty' => $promotionUsedPayload['free_service_qty'],
                    'snapshot_json'    => $promotionUsedPayload['snapshot_json'],
                ]);
            }

            Log::info('[Order.update] RECOMPUTED', [
                'order_id'       => $order->id,
                'subtotal'       => $subtotal,
                'discount_total' => $discountTotal,
                'grand_total'    => $grandTotal,
            ]);
        });

        return redirect()->back()->with('success', 'Order berhasil diperbarui.');
    }

    public function destroy(Order $order)
    {
        DB::transaction(function () use ($order) {
            $order->services()->detach();
            $order->promotionsUsed()->delete();
            $order->payments()->delete();
            $order->delete();
        });

        return redirect()->back()->with('success', 'Order berhasil dihapus.');
    }

    public function createFromBot(Request $request)
    {
        $validated = $request->validate([
            'phone'               => 'required|string',
            'service_id'          => 'required|exists:services,id',
            'booking_id'          => 'required|exists:bookings,id',
            'selected_option'     => 'required', // string (single) atau array (multi)
            'payment_preference'  => 'required|string|in:online,cash',
            'passport_country'    => 'nullable|string|max:100',

            // general notes for the order, coming from bot flow
            'order_notes'         => 'nullable|string|max:2000',
        ]);

        $customer = Customer::where('phone', $validated['phone'])->first();
        if (!$customer) {
            return response()->json(['message' => 'Customer not found.'], 404);
        }

        if (!empty($validated['passport_country'])) {
            $customer->update(['passport_country' => $validated['passport_country']]);
        }

        $service = Service::findOrFail($validated['service_id']);
        $booking = Booking::findOrFail($validated['booking_id']);

        $quantity     = 1;
        $pricePerUnit = $service->price;
        $details      = [];

        switch ($service->type) {
            case 'selectable': {
                $optionName     = (string) $validated['selected_option'];
                $selectedOption = collect($service->options)->firstWhere('name', $optionName);
                if ($selectedOption) {
                    $pricePerUnit       = (float) $selectedOption['price'];
                    $details['package'] = $optionName;
                }
                break;
            }

            case 'multiple_options': {
                $selected = $validated['selected_option'];
                $names    = is_array($selected) ? $selected : (array) $selected;
                $sum      = 0.0;
                foreach ($names as $n) {
                    $opt = collect($service->options)->firstWhere('name', (string) $n);
                    if ($opt) {
                        $sum += (float) $opt['price'];
                    }
                }
                $quantity            = 1;
                $pricePerUnit        = $sum;
                $details['packages'] = array_values(array_unique(array_map('strval', $names)));
                break;
            }

            case 'fixed': {
                $pricePerUnit = (float) $service->price;
                break;
            }

            case 'per_unit': {
                $weight            = (float) $validated['selected_option'];
                $quantity          = $weight;
                $pricePerUnit      = (float) $service->price;
                $details['weight'] = $weight;
                break;
            }

            case 'free': {
                $quantity     = 1;
                $pricePerUnit = 0.0;
                $details      = [];
                break;
            }
        }

        $lineTotal  = $pricePerUnit * $quantity;
        $subtotal   = $lineTotal;
        $grandTotal = $subtotal;

        $order = DB::transaction(function () use (
            $customer,
            $booking,
            $service,
            $quantity,
            $pricePerUnit,
            $details,
            $subtotal,
            $grandTotal,
            $validated
        ) {
            // CREATE ORDER (includes order-level notes from bot)
            $order = Order::create([
                'customer_id'        => $customer->id,
                'booking_id'         => $booking->id,
                'status'             => 'pending',
                'payment_preference' => $validated['payment_preference'],
                'subtotal'           => $subtotal,
                'discount_total'     => 0,
                'grand_total'        => $grandTotal,
                'notes'              => $validated['order_notes'] ?? null,
            ]);

            // attach just 1 line service
            $order->services()->attach($service->id, [
                'quantity'       => $quantity,
                'price_per_unit' => $pricePerUnit,
                'details'        => json_encode($details),
                'answers_json'   => null, // bot flow ini tidak memakai QnA
            ]);

            Payment::create([
                'order_id' => $order->id,
                'method'   => $validated['payment_preference'],
                'amount'   => $grandTotal,
                'currency' => 'IDR',
                'status'   => 'pending',
            ]);

            return $order;
        });

        return response()->json([
            'success'     => true,
            'order_id'    => $order->id,
            'total_price' => $grandTotal,
        ]);
    }

    /* ======================= Helpers ======================= */

    private function computeLines(array $servicesPayload): array
    {
        $lineItems = [];

        foreach ($servicesPayload as $srv) {
            $service = Service::with('activeQuestion')->findOrFail($srv['id']);

            $quantity     = (float) ($srv['quantity'] ?? 1);
            $pricePerUnit = (float) $service->price;
            $details      = $srv['details'] ?? [];

            switch ($service->type) {
                case 'selectable': {
                    $packageName = $details['package'] ?? null;
                    if ($packageName) {
                        foreach ((array) $service->options as $option) {
                            if ($option['name'] === $packageName) {
                                $pricePerUnit = (float) $option['price'];
                                break;
                            }
                        }
                    }
                    break;
                }

                case 'multiple_options': {
                    $names = $details['packages'] ?? [];
                    $names = is_array($names) ? $names : (array) $names;
                    $sum   = 0.0;
                    foreach ($names as $n) {
                        foreach ((array) $service->options as $option) {
                            if ($option['name'] === $n) {
                                $sum += (float) $option['price'];
                                break;
                            }
                        }
                    }
                    $pricePerUnit = $sum; // 1 unit = kombinasi opsi terpilih
                    break;
                }

                case 'per_unit': {
                    $weight       = (float) ($details['weight'] ?? 0);
                    $quantity     = $weight;
                    $pricePerUnit = (float) $service->price;
                    break;
                }

                case 'free': {
                    $quantity     = 1;
                    $pricePerUnit = 0.0;
                    $details      = [];
                    break;
                }

                case 'fixed':
                default: {
                    $pricePerUnit = (float) $service->price;
                }
            }

            if ($service->type !== 'free') {
                $quantity = max($quantity, 0);
            }

            $lineTotal = $pricePerUnit * $quantity;

            $answersData = null;
            if ($service->activeQuestion) {
                $questions = $service->activeQuestion->questions_json;
                $answers   = $details['answers'] ?? [];

                // pad answers supaya panjangnya sama dengan questions
                while (count($answers) < count($questions)) {
                    $answers[] = '';
                }

                $answersData = [
                    'questions_snapshot' => $questions,
                    'answers'            => array_slice($answers, 0, count($questions)),
                ];

                // penting: jangan ikut simpan 'answers' di details (details harus cuma opsi/weight/etc)
                unset($details['answers']);
            }

            $lineItems[] = [
                'service_id'     => $service->id,
                'type'           => $service->type,
                'quantity'       => $quantity,
                'price_per_unit' => $pricePerUnit,
                'line_total'     => $lineTotal,
                'details'        => $details,     // hanya package/packages/weight dll
                'answers_data'   => $answersData, // disimpan ke pivot.answers_json
            ];
        }

        return $lineItems;
    }

    private function isPromotionEligibleSimple(Promotion $p, Customer $customer, array $selectedServiceIds, Carbon $asOf): array
    {
        if (!$p->active) {
            return ['ok' => false, 'reason' => 'Promo inactive'];
        }

        $scopedIds = $p->services->pluck('id')->all();
        if (!empty($scopedIds)) {
            $intersect = array_values(array_intersect($selectedServiceIds, $scopedIds));
            if (empty($intersect)) {
                return ['ok' => false, 'reason' => 'No scoped services selected'];
            }
        }

        if ($p->type === 'birthday') {
            if (!$customer->birth_date) {
                return ['ok' => false, 'reason' => 'No birth date'];
            }
            $daysBefore       = $p->birthday_days_before ?? 3;
            $birthdayThisYear = Carbon::parse($customer->birth_date)->year($asOf->year);
            $diffDays         = $birthdayThisYear->diffInDays($asOf, false);
            $ok               = ($diffDays <= 0) && ($diffDays >= -$daysBefore);
            return [
                'ok'     => $ok,
                'reason' => $ok ? null : 'Not in birthday window'
            ];
        }

        if ($p->type === 'membership') {
            $tier = optional($customer->membership)->membership_type;
            $need = $p->membership_tier;
            $ok   = $tier && $need && (strtolower($tier) === strtolower($need));
            return [
                'ok'     => $ok,
                'reason' => $ok ? null : 'Membership not matched'
            ];
        }

        return ['ok' => true, 'reason' => null];
    }

    private function computeDiscountFromPromotion(Promotion $p, array $lineItems, float $subtotal): float
    {
        $scopedIds = $p->services->pluck('id')->all();

        $scopeSubtotal = collect($lineItems)
            ->filter(function ($li) use ($scopedIds) {
                return empty($scopedIds)
                    ? true
                    : in_array($li['service_id'], $scopedIds);
            })
            ->sum('line_total');

        $discount = 0.0;

        if (!empty($p->discount_percent)) {
            $discount += ($scopeSubtotal * ((int) $p->discount_percent) / 100.0);
        }

        if (!empty($p->discount_amount)) {
            $discount += min((float) $p->discount_amount, $scopeSubtotal);
        }

        $discount = max(0, min($discount, $subtotal));

        return round($discount, 2);
    }
}
