<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Customer;
use App\Models\Service;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // Get today's statistics
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();

        // Revenue today
        $revenueToday = Order::whereDate('created_at', $today)
            ->where('status', '!=', 'cancelled')
            ->with('services')
            ->get()
            ->sum(function ($order) {
                return $order->total_price;
            });

        $revenueYesterday = Order::whereDate('created_at', $yesterday)
            ->where('status', '!=', 'cancelled')
            ->with('services')
            ->get()
            ->sum(function ($order) {
                return $order->total_price;
            });

        // Calculate change percentage with special handling for zero yesterday
        if ($revenueYesterday > 0) {
            $revenueChange = round((($revenueToday - $revenueYesterday) / $revenueYesterday) * 100, 1);
        } else {
            // If yesterday was 0 but today has revenue, show 100% growth
            $revenueChange = $revenueToday > 0 ? 100 : 0;
        }

        // Customers today
        $customersToday = Customer::whereDate('created_at', $today)->count();
        $customersYesterday = Customer::whereDate('created_at', $yesterday)->count();

        // Calculate change percentage with special handling for zero yesterday
        if ($customersYesterday > 0) {
            $customersChange = round((($customersToday - $customersYesterday) / $customersYesterday) * 100, 1);
        } else {
            // If yesterday was 0 but today has customers, show 100% growth
            $customersChange = $customersToday > 0 ? 100 : 0;
        }

        /// Orders today
        $ordersToday = Order::whereDate('created_at', $today)->count();
        $ordersYesterday = Order::whereDate('created_at', $yesterday)->count();

        // Calculate change percentage with special handling for zero yesterday
        if ($ordersYesterday > 0) {
            $ordersChange = round((($ordersToday - $ordersYesterday) / $ordersYesterday) * 100, 1);
        } else {
            // If yesterday was 0 but today has orders, show 100% growth
            $ordersChange = $ordersToday > 0 ? 100 : 0;
        }

        // Customer activity for the last 7 days
        $last7Days = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $checkIns = Customer::whereDate('checkin_at', $date)->count();

            $servicesOrdered = Order::whereDate('created_at', $date)
                ->with('services')
                ->get()
                ->sum(function ($order) {
                    return $order->services->count();
                });

            $last7Days->push([
                'date' => $date->format('Y-m-d'),
                'checkIns' => $checkIns,
                'servicesOrdered' => $servicesOrdered,
            ]);
        }

        // Top services by revenue in the last 7 days
        $topServices = Service::with(['orders' => function ($query) {
            $query->where('orders.created_at', '>=', Carbon::now()->subDays(7))
                ->where('orders.status', '!=', 'cancelled');
        }])
            ->get()
            ->map(function ($service) {
                // Explicitly cast pivot values to numbers
                $totalRevenue = $service->orders->sum(function ($order) {
                    $pricePerUnit = (float) $order->pivot->price_per_unit;
                    $quantity = (int) $order->pivot->quantity;
                    return $pricePerUnit * $quantity;
                });

                $orderCount = $service->orders->count();

                return [
                    'id' => $service->id,
                    'serviceName' => $service->name,
                    'orderCount' => $orderCount,
                    'totalRevenue' => $totalRevenue,
                ];
            })
            ->sortByDesc('totalRevenue')
            ->take(5)
            ->values();

        // Calculate change percentage for each service (compared to previous 7 days)
        $topServices = $topServices->map(function ($service, $index) {
            $previousRevenue = Service::find($service['id'])
                ->orders()
                ->where('orders.created_at', '>=', Carbon::now()->subDays(14))
                ->where('orders.created_at', '<', Carbon::now()->subDays(7))
                ->where('orders.status', '!=', 'cancelled')
                ->get()
                ->sum(function ($order) {
                    // Explicitly cast pivot values to numbers
                    $pricePerUnit = (float) $order->pivot->price_per_unit;
                    $quantity = (int) $order->pivot->quantity;
                    return $pricePerUnit * $quantity;
                });

            $change = $previousRevenue > 0
                ? round((($service['totalRevenue'] - $previousRevenue) / $previousRevenue) * 100, 1)
                : 0;

            $service['change'] = $change > 0 ? "+$change%" : "$change%";
            $service['rank'] = $index + 1;

            return $service;
        });

        return Inertia::render('Dashboard', [
            'stats' => [
                'revenue' => [
                    'today' => $revenueToday,
                    'yesterday' => $revenueYesterday,
                    'change' => $revenueChange,
                ],
                'customers' => [
                    'today' => $customersToday,
                    'yesterday' => $customersYesterday,
                    'change' => $customersChange,
                ],
                'orders' => [
                    'today' => $ordersToday,
                    'yesterday' => $ordersYesterday,
                    'change' => $ordersChange,
                ],
            ],
            'chartData' => $last7Days,
            'topServices' => $topServices,
        ]);
    }
}
