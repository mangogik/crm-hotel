<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $perPage         = (int) $request->input('per_page', 10);
        $search          = $request->input('search');
        $passportCountry = $request->input('passport_country');
        $membershipType  = $request->input('membership_type');
        $lastVisitFrom   = $request->input('last_visit_from');
        $lastVisitTo     = $request->input('last_visit_to');
        $sortBy          = $request->input('sort_by', 'created_at');
        $sortDirection   = in_array(strtolower($request->input('sort_direction', 'desc')), ['asc', 'desc'])
            ? $request->input('sort_direction', 'desc')
            : 'desc';

        // Tambahkan orders.services agar order history punya nama2 service
        $query = Customer::with(['membership', 'bookings.room', 'orders.services']);

        if ($search && is_string($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('passport_country', 'like', "%{$search}%");
            });
        }

        if ($passportCountry && is_string($passportCountry)) {
            $query->where('passport_country', $passportCountry);
        }

        if ($membershipType && is_string($membershipType)) {
            $query->whereHas('membership', function ($q) use ($membershipType) {
                $q->where('membership_type', $membershipType);
            });
        }

        if ($lastVisitFrom) {
            $query->whereDate('last_visit_date', '>=', $lastVisitFrom);
        }

        if ($lastVisitTo) {
            $query->whereDate('last_visit_date', '<=', $lastVisitTo);
        }

        $allowedSorts = [
            'name',
            'email',
            'phone',
            'created_at',
            'passport_country',
            'total_visits',
            'last_visit_date',
            'birth_date',
        ];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }

        $paginator = $query->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        // Bentuk payload table + detail (booking history + order history dengan nama service)
        $paginator->getCollection()->transform(function ($c) {
            return [
                'id'                 => $c->id,
                'name'               => $c->name,
                'email'              => $c->email,
                'phone'              => $c->phone,
                'passport_country'   => $c->passport_country,
                'preferred_language' => $c->preferred_language ?? 'id',
                'birth_date'         => $c->birth_date ? $c->birth_date->toDateString() : null,
                'total_visits'       => $c->total_visits,
                'last_visit_date'    => $c->last_visit_date ? $c->last_visit_date->toDateString() : null,
                'created_at'         => $c->created_at ? $c->created_at->toDateTimeString() : null,

                'membership' => $c->membership ? [
                    'membership_type'     => $c->membership->membership_type,
                    'discount_percentage' => $c->membership->discount_percentage,
                ] : null,

                // Booking history (kiri)
                'bookings' => $c->bookings
                    ->sortByDesc('checkin_at')
                    ->map(function ($booking) {
                        return [
                            'id'          => $booking->id,
                            'checkin_at'  => $booking->checkin_at ? $booking->checkin_at->toDateString() : null,
                            'checkout_at' => $booking->checkout_at ? $booking->checkout_at->toDateString() : null,
                            'status'      => $booking->status,
                            'room_number' => $booking->room ? $booking->room->room_number : null,
                        ];
                    })->values()->all(),

                // Order history (kanan) — fokus pada nama service
                'orders' => $c->orders
                    ->sortByDesc('created_at')
                    ->map(function ($o) {
                        $amount = !is_null($o->grand_total)
                            ? (float) $o->grand_total
                            : (!is_null($o->total_price) ? (float) $o->total_price : 0.0);

                        $items = $o->services->map(function ($s) {
                            $qty = (float) ($s->pivot->quantity ?? 0);
                            $ppu = (float) ($s->pivot->price_per_unit ?? 0);
                            return [
                                'service_id'       => $s->id,
                                'name'             => $s->name,
                                'quantity'         => $qty,
                                'price_per_unit'   => $ppu,
                                'line_total'       => $qty * $ppu,
                                'offering_session' => $s->offering_session,
                            ];
                        })->values()->all();

                        return [
                            'id'                 => $o->id,
                            'created_at'         => $o->created_at ? $o->created_at->toDateString() : null,
                            'status'             => $o->status,
                            'payment_preference' => $o->payment_preference,
                            'amount'             => $amount,
                            'items'              => $items,
                            'service_names'      => array_values(array_map(fn($it) => $it['name'], $items)),
                        ];
                    })->values()->all(),
            ];
        });

        return Inertia::render('Customers', [
            'customers' => $paginator,
            'filters'   => [
                'search'           => $request->input('search', ''),
                'passport_country' => $request->input('passport_country', ''),
                'membership_type'  => $request->input('membership_type', ''),
                'last_visit_from'  => $request->input('last_visit_from', ''),
                'last_visit_to'    => $request->input('last_visit_to', ''),
                'per_page'         => $perPage,
                'sort_by'          => $sortBy,
                'sort_direction'   => $sortDirection,
            ],
        ]);
    }

    public function show(Customer $customer)
    {
        // Pertahankan show, tapi siapkan nama service juga
        $customer->load(['membership', 'bookings.room', 'bookings.orders.services']);

        return Inertia::render('Customers/Show', [
            'customer' => [
                'id'                 => $customer->id,
                'name'               => $customer->name,
                'email'              => $customer->email,
                'phone'              => $customer->phone,
                'passport_country'   => $customer->passport_country,
                'preferred_language' => $customer->preferred_language ?? 'id',
                'birth_date'         => $customer->birth_date ? $customer->birth_date->toDateString() : null,
                'total_visits'       => $customer->total_visits,
                'last_visit_date'    => $customer->last_visit_date ? $customer->last_visit_date->toDateString() : null,
                'created_at'         => $customer->created_at ? $customer->created_at->toDateTimeString() : null,

                'membership' => $customer->membership ? [
                    'membership_type'     => $customer->membership->membership_type,
                    'join_date'           => $customer->membership->join_date->toDateString(),
                    'total_bookings'      => $customer->membership->total_bookings,
                    'discount_percentage' => $customer->membership->discount_percentage,
                ] : null,

                'bookings' => $customer->bookings->map(function ($booking) {
                    return [
                        'id'          => $booking->id,
                        'checkin_at'  => $booking->checkin_at ? $booking->checkin_at->toDateString() : null,
                        'checkout_at' => $booking->checkout_at ? $booking->checkout_at->toDateString() : null,
                        'status'      => $booking->status,
                        'room_number' => $booking->room ? $booking->room->room_number : null,
                        'orders'      => $booking->orders->map(function ($order) {
                            $items = $order->services->map(function ($s) {
                                $qty = (float) ($s->pivot->quantity ?? 0);
                                $ppu = (float) ($s->pivot->price_per_unit ?? 0);
                                return [
                                    'service_id'     => $s->id,
                                    'name'           => $s->name,
                                    'quantity'       => $qty,
                                    'price_per_unit' => $ppu,
                                    'line_total'     => $qty * $ppu,
                                ];
                            })->values()->all();

                            return [
                                'id'                 => $order->id,
                                'status'             => $order->status,
                                'payment_preference' => $order->payment_preference,
                                'total_price'        => $order->total_price, // field lama tetap
                                'items'              => $items,
                                'service_names'      => array_values(array_map(fn($it) => $it['name'], $items)),
                            ];
                        }),
                    ];
                }),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'               => 'required|string|max:255',
            'email'              => 'nullable|email|max:255',
            'phone'              => ['nullable', 'string', 'max:255', 'unique:customers,phone'],
            'passport_country'   => 'nullable|string|max:100',
            'birth_date'         => 'nullable|date',
            'preferred_language' => ['sometimes', 'in:id,en'], // biarkan default DB 'id' kalau tidak dikirim
        ]);

        // Jangan menimpa default DB 'id' dengan string kosong
        if (array_key_exists('preferred_language', $data) && $data['preferred_language'] === '') {
            unset($data['preferred_language']);
        }

        $data['total_visits'] = 0;

        $customer = Customer::create($data);

        // Membership default
        $customer->membership()->create([
            'membership_type'     => 'regular',
            'join_date'           => now()->toDateString(),
            'total_bookings'      => 0,
            'discount_percentage' => 0.00,
        ]);

        return redirect()->back()->with('success', 'Customer created successfully.');
    }

    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'name'               => 'required|string|max:255',
            'email'              => 'nullable|email|max:255',
            'phone'              => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('customers', 'phone')->ignore($customer->id),
            ],
            'passport_country'   => 'nullable|string|max:100',
            'birth_date'         => 'nullable|date',
            'preferred_language' => ['sometimes', 'in:id,en'], // optional update
        ]);

        // Jika dikirim kosong, abaikan agar nilai existing tidak berubah
        if (array_key_exists('preferred_language', $data) && $data['preferred_language'] === '') {
            unset($data['preferred_language']);
        }

        $customer->update($data);

        return redirect()->back()->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return redirect()->back()->with('success', 'Customer deleted successfully.');
    }
}
