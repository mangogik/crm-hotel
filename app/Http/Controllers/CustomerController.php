<?php

// app/Http/Controllers/CustomerController.php
namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search');
        $passportCountry = $request->input('passport_country');
        $membershipType = $request->input('membership_type');
        $lastVisitFrom = $request->input('last_visit_from');
        $lastVisitTo = $request->input('last_visit_to');
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = in_array(strtolower($request->input('sort_direction', 'desc')), ['asc', 'desc']) ? $request->input('sort_direction', 'desc') : 'desc';

        // DIUBAH: Ganti 'latestBooking.room' menjadi 'bookings.room' untuk mengambil semua booking
        $query = Customer::with(['membership', 'bookings.room']);

        if ($search && is_string($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('passport_country', 'like', "%{$search}%");
            });
        }

        // ... (sisa query filter Anda tetap sama) ...

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

        $allowedSorts = ['name', 'email', 'phone', 'created_at', 'passport_country', 'total_visits', 'last_visit_date'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }

        $paginator = $query->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        $paginator->getCollection()->transform(function ($c) {
            return [
                'id' => $c->id,
                'name' => $c->name,
                'email' => $c->email,
                'phone' => $c->phone,
                'passport_country' => $c->passport_country,
                'total_visits' => $c->total_visits,
                'last_visit_date' => $c->last_visit_date ? $c->last_visit_date->toDateString() : null,
                'notes' => $c->notes,
                'created_at' => $c->created_at ? $c->created_at->toDateTimeString() : null,
                'membership' => $c->membership ? [
                    'membership_type' => $c->membership->membership_type,
                    'discount_percentage' => $c->membership->discount_percentage,
                ] : null,

                // DIUBAH: Ganti 'latest_booking' menjadi 'bookings' (jamak)
                'bookings' => $c->bookings
                    ->sortByDesc('checkin_at') // Urutkan dari yang terbaru
                    ->map(function ($booking) {
                        return [
                            'id' => $booking->id,
                            'checkin_at' => $booking->checkin_at ? $booking->checkin_at->toDateString() : null,
                            'checkout_at' => $booking->checkout_at ? $booking->checkout_at->toDateString() : null,
                            'status' => $booking->status,
                            'room_number' => $booking->room ? $booking->room->room_number : null,
                        ];
                    })->values()->all(), // Gunakan values() untuk reset keys array
            ];
        });

        return Inertia::render('Customers', [
            'customers' => $paginator,
            'filters' => [
                'search' => $search ?: '',
                'passport_country' => $passportCountry ?: '',
                'membership_type' => $membershipType ?: '',
                'last_visit_from' => $lastVisitFrom ?: '',
                'last_visit_to' => $lastVisitTo ?: '',
                'per_page' => $perPage,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    public function show(Customer $customer)
    {
        // Perbaikan eager loading
        $customer->load(['membership', 'bookings.room', 'bookings.orders']);

        return Inertia::render('Customers/Show', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'passport_country' => $customer->passport_country,
                'total_visits' => $customer->total_visits,
                'last_visit_date' => $customer->last_visit_date ? $customer->last_visit_date->toDateString() : null,
                'notes' => $customer->notes,
                'created_at' => $customer->created_at ? $customer->created_at->toDateTimeString() : null,
                'membership' => $customer->membership ? [
                    'membership_type' => $customer->membership->membership_type,
                    'join_date' => $customer->membership->join_date->toDateString(),
                    'total_bookings' => $customer->membership->total_bookings,
                    'discount_percentage' => $customer->membership->discount_percentage,
                ] : null,
                'bookings' => $customer->bookings->map(function ($booking) {
                    return [
                        'id' => $booking->id,
                        'checkin_at' => $booking->checkin_at ? $booking->checkin_at->toDateString() : null,
                        'checkout_at' => $booking->checkout_at ? $booking->checkout_at->toDateString() : null,
                        'status' => $booking->status,
                        'room_number' => $booking->room ? $booking->room->room_number : null,
                        'orders' => $booking->orders->map(function ($order) {
                            return [
                                'id' => $order->id,
                                'status' => $order->status,
                                'payment_method' => $order->payment_method,
                                'total_price' => $order->total_price,
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
            'name'             => 'required|string|max:255',
            'email'            => 'nullable|email|max:255',
            'phone'            => 'nullable|string|max:20',
            'passport_country' => 'nullable|string|max:100',
            'notes'            => 'nullable|string',
        ]);

        $data['total_visits'] = 0;

        $customer = Customer::create($data);

        // Create membership record untuk customer baru
        $customer->membership()->create([
            'membership_type' => 'regular',
            'join_date' => now()->toDateString(),
            'total_bookings' => 0,
            'discount_percentage' => 0.00,
        ]);

        return redirect()->back()->with('success', 'Customer created successfully.');
    }

    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'email'            => 'nullable|email|max:255',
            'phone'            => 'nullable|string|max:20',
            'passport_country' => 'nullable|string|max:100',
            'notes'            => 'nullable|string',
        ]);

        $customer->update($data);

        return redirect()->back()->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return redirect()->back()->with('success', 'Customer deleted successfully.');
    }
}
