<?php

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
        $checkinDate = $request->input('checkin_date');
        $checkoutDate = $request->input('checkout_date');
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = in_array(strtolower($request->input('sort_direction', 'desc')), ['asc', 'desc']) ? $request->input('sort_direction', 'desc') : 'desc';

        $query = Customer::query();

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

        if ($checkinDate) {
            $query->whereDate('checkin_at', $checkinDate);
        }

        if ($checkoutDate) {
            $query->whereDate('checkout_at', $checkoutDate);
        }
        if ($passportCountry && is_string($passportCountry)) {
            $query->where('passport_country', $passportCountry);
        }

        // Prevent sorting by unsafe columns: whitelist
        $allowedSorts = ['name', 'email', 'phone', 'created_at', 'checkin_at', 'checkout_at', 'passport_country'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }

        $paginator = $query->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        // Transform each customer to primitive types (dates as ISO) to avoid hydration issues
        $paginator->getCollection()->transform(function ($c) {
            return [
                'id' => $c->id,
                'name' => $c->name,
                'email' => $c->email,
                'phone' => $c->phone,
                'passport_country' => $c->passport_country,
                'checkin_at' => $c->checkin_at ? $c->checkin_at->toDateString() : null,
                'checkout_at' => $c->checkout_at ? $c->checkout_at->toDateString() : null,
                'notes' => $c->notes,
                'created_at' => $c->created_at ? $c->created_at->toDateTimeString() : null,
            ];
        });

        return Inertia::render('Customers', [
            'customers' => $paginator,
            'filters' => [
                'search' => $search ?: '',
                'passport_country' => $passportCountry ?: '',
                'checkin_date' => $checkinDate ?: '',
                'checkout_date' => $checkoutDate ?: '',
                'per_page' => $perPage,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    public function show(Customer $customer)
    {
        return Inertia::render('Customers/Show', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'passport_country' => $customer->passport_country,
                'checkin_at' => $customer->checkin_at ? $customer->checkin_at->toDateString() : null,
                'checkout_at' => $customer->checkout_at ? $customer->checkout_at->toDateString() : null,
                'notes' => $customer->notes,
                'created_at' => $customer->created_at ? $customer->created_at->toDateTimeString() : null,
                'orders' => $customer->orders()->select('id', 'created_at', 'total')->get(),
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
            'checkin_at'       => 'nullable|date',
            'checkout_at'      => 'nullable|date|after_or_equal:checkin_at',
            'notes'            => 'nullable|string',
        ]);

        Customer::create($data);

        return redirect()->back()->with('success', 'Customer created successfully.');
    }

    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'email'            => 'nullable|email|max:255',
            'phone'            => 'nullable|string|max:20',
            'passport_country' => 'nullable|string|max:100',
            'checkin_at'       => 'nullable|date',
            'checkout_at'      => 'nullable|date|after_or_equal:checkin_at',
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
