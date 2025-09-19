<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function createFromBot(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'service_id' => 'required|exists:services,id',
            'selected_option' => 'required_if:service.type,selectable,per_unit',
            'payment_method' => 'required|string|in:online,cash',
        ]);

        $customer = Customer::where('phone', $validated['phone'])->first();

        if (!$customer) {
            Log::error('Customer not found for phone: ' . $validated['phone']);
            return response()->json(['message' => 'Customer not found.'], 404);
        }

        $service = Service::findOrFail($validated['service_id']);
        $totalPrice = 0;
        $details = [];

        switch ($service->type) {
            case 'selectable':
                $selectedOption = collect($service->options)
                    ->firstWhere('name', $validated['selected_option']);
                if ($selectedOption) {
                    $totalPrice = $selectedOption['price'];
                    $details['package'] = $validated['selected_option'];
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
            'status' => 'pending',
            'payment_method' => $validated['payment_method'],
        ]);

        $order->services()->attach($service->id, [
            'quantity' => 1,
            'price_per_unit' => $totalPrice,
            'details' => json_encode($details)
        ]);

        $paymentUrl = null;
        if ($validated['payment_method'] === 'online') {
            Log::info("Membuat payment link untuk Order #{$order->id}");
            $paymentUrl = 'https://example.com/pay/' . uniqid();
        }

        return response()->json([
            'success' => true,
            'order_id' => $order->id,
            'total_price' => $totalPrice,
            'payment_url' => $paymentUrl,
        ]);
    }
}
