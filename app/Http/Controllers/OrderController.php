<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Order;
use App\Models\Service;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $filterStatus = $request->input('status');
        $filterPaymentMethod = $request->input('payment_method');
        $filterCountry = $request->input('country'); // Add country filter
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = in_array(strtolower($request->input('sort_direction', 'desc')), ['asc', 'desc'])
            ? $request->input('sort_direction', 'desc')
            : 'desc';

        $orders = Order::query()
            ->with(['customer', 'services'])
            ->when($filterStatus, fn($q) => $q->where('status', $filterStatus))
            ->when($filterPaymentMethod, fn($q) => $q->where('payment_method', $filterPaymentMethod))
            ->when($filterCountry, function ($q) use ($filterCountry) { // Add country filter
                $q->whereHas('customer', function ($sub) use ($filterCountry) {
                    $sub->where('passport_country', $filterCountry);
                });
            })
            ->when($search, function ($q) use ($search) {
                $q->whereHas('customer', function ($sub) use ($search) {
                    $sub->where('name', 'like', "%$search%")
                        ->orWhere('phone', 'like', "%$search%")
                        ->orWhere('passport_country', 'like', "%$search%");
                });
            })
            ->orderBy($sortBy, $sortDirection)
            ->paginate(10)
            ->withQueryString()
            ->append('total_price');

        $customers = Customer::orderBy('name')->get();
        $services = Service::orderBy('name')->get();

        return Inertia::render('Orders', [
            'orders' => $orders,
            'customers' => $customers,
            'services' => $services,
            'filters' => [
                'search' => $search,
                'status' => $filterStatus,
                'payment_method' => $filterPaymentMethod,
                'country' => $filterCountry,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
                'per_page' => 10,
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'services' => 'required|array|min:1',
            'services.*.id' => 'required|exists:services,id',
            'services.*.quantity' => 'nullable|integer|min:1',
            'services.*.details.package' => 'nullable|string',
            'services.*.details.weight' => 'nullable|numeric|min:0',
            'status' => 'required|string|in:pending,paid,cancelled',
            'payment_method' => 'required|string|in:cash,online',
        ]);

        $order = Order::create([
            'customer_id' => $validated['customer_id'],
            'status' => $validated['status'],
            'payment_method' => $validated['payment_method'],
        ]);

        foreach ($validated['services'] as $srv) {
            $service = Service::findOrFail($srv['id']);
            $pricePerUnit = $service->price;
            $details = $srv['details'] ?? [];

            switch ($service->type) {
                case 'selectable':
                    $packageName = $details['package'] ?? null;
                    if ($packageName) {
                        foreach ($service->options as $option) {
                            if ($option['name'] === $packageName) {
                                $pricePerUnit = $option['price'];
                                break;
                            }
                        }
                    }
                    break;
                case 'per_unit':
                    $weight = $details['weight'] ?? 0;
                    $pricePerUnit = $service->price;
                    $srv['quantity'] = $weight;
                    break;
            }

            $order->services()->attach($service->id, [
                'quantity' => $srv['quantity'] ?? 1,
                'price_per_unit' => $pricePerUnit,
                'details' => json_encode($details),
            ]);
        }

        return redirect()->back()->with('success', 'Order baru berhasil dibuat.');
    }

    public function update(Request $request, Order $order)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'services' => 'required|array|min:1',
            'services.*.id' => 'required|exists:services,id',
            'services.*.quantity' => 'nullable|integer|min:1',
            'services.*.details.package' => 'nullable|string',
            'services.*.details.weight' => 'nullable|numeric|min:0',
            'status' => 'required|string|in:pending,paid,cancelled',
            'payment_method' => 'required|string|in:cash,online',
        ]);

        $order->update([
            'customer_id' => $validated['customer_id'],
            'status' => $validated['status'],
            'payment_method' => $validated['payment_method'],
        ]);

        // Remove existing services and attach new ones
        $order->services()->detach();

        foreach ($validated['services'] as $srv) {
            $service = Service::findOrFail($srv['id']);
            $pricePerUnit = $service->price;
            $details = $srv['details'] ?? [];

            switch ($service->type) {
                case 'selectable':
                    $packageName = $details['package'] ?? null;
                    if ($packageName) {
                        foreach ($service->options as $option) {
                            if ($option['name'] === $packageName) {
                                $pricePerUnit = $option['price'];
                                break;
                            }
                        }
                    }
                    break;
                case 'per_unit':
                    $weight = $details['weight'] ?? 0;
                    $pricePerUnit = $service->price;
                    $srv['quantity'] = $weight;
                    break;
            }

            $order->services()->attach($service->id, [
                'quantity' => $srv['quantity'] ?? 1,
                'price_per_unit' => $pricePerUnit,
                'details' => json_encode($details),
            ]);
        }

        return redirect()->back()->with('success', 'Order berhasil diperbarui.');
    }

    public function destroy(Order $order)
    {
        $order->services()->detach();
        $order->delete();

        return redirect()->back()->with('success', 'Order berhasil dihapus.');
    }

    public function createFromBot(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'service_id' => 'required|exists:services,id',
            'booking_id' => 'required|exists:bookings,id',
            'selected_option' => 'required_if:service.type,selectable,per_unit',
            'payment_method' => 'required|string|in:online,cash',
            'passport_country' => 'nullable|string|max:100',
        ]);

        $customer = Customer::where('phone', $validated['phone'])->first();
        if (!$customer) {
            return response()->json(['message' => 'Customer not found.'], 404);
        }

        // Update passport_country jika dikirim dari bot
        if (!empty($validated['passport_country'])) {
            $customer->update(['passport_country' => $validated['passport_country']]);
        }

        $service = Service::findOrFail($validated['service_id']);
        $booking = Booking::findOrFail($validated['booking_id']);
        $totalPrice = 0;
        $details = [];

        switch ($service->type) {
            case 'selectable':
                $optionName = $validated['selected_option'];
                $selectedOption = collect($service->options)->firstWhere('name', $optionName);
                if ($selectedOption) {
                    $totalPrice = $selectedOption['price'];
                    $details['package'] = $optionName;
                }
                break;
            case 'fixed':
                $totalPrice = $service->price;
                break;
            case 'per_unit':
                $quantity = (int) $validated['selected_option'];
                $totalPrice = $service->price * $quantity;
                $details['quantity_unit'] = $quantity;
                break;
        }

        $order = Order::create([
            'customer_id' => $customer->id,
            'booking_id' => $booking->id,
            'status' => 'pending',
            'payment_method' => $validated['payment_method'],
        ]);

        $order->services()->attach($service->id, [
            'quantity' => 1,
            'price_per_unit' => $totalPrice,
            'details' => json_encode($details),
        ]);

        return response()->json([
            'success' => true,
            'order_id' => $order->id,
            'total_price' => $totalPrice,
        ]);
    }
}
