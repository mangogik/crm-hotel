<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $type = $request->input('type');
        $fulfillmentType = $request->input('fulfillment_type');
        $offeringSession = $request->input('offering_session'); // New filter
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = in_array(strtolower($request->input('sort_direction', 'desc')), ['asc', 'desc'])
            ? $request->input('sort_direction', 'desc')
            : 'desc';

        $query = Service::query();

        if ($search && is_string($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($type && is_string($type)) {
            $query->where('type', $type);
        }

        if ($fulfillmentType && is_string($fulfillmentType)) {
            $query->where('fulfillment_type', $fulfillmentType);
        }

        // New filter for offering_session
        if ($offeringSession && is_string($offeringSession)) {
            $query->where('offering_session', $offeringSession);
        }

        $allowedSorts = ['name', 'type', 'fulfillment_type', 'price', 'created_at', 'offering_session'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }

        $services = $query->orderBy($sortBy, $sortDirection)
            ->paginate(10)
            ->withQueryString();

        // --- DATA UNTUK KARTU WAWASAN ---

        // 1. Layanan Paling Populer (berdasarkan jumlah pesanan)
        $mostPopularService = Service::withCount('orders')
            ->orderBy('orders_count', 'desc')
            ->first();

        // 2. Layanan Paling Menguntungkan
        $servicesWithRevenue = Service::with('orders')->get()->map(function ($service) {
            $revenue = $service->orders->sum(fn($order) => ($order->pivot->price_per_unit ?? 0) * ($order->pivot->quantity ?? 0));
            return ['name' => $service->name, 'revenue' => $revenue];
        });
        $highestRevenueService = $servicesWithRevenue->sortByDesc('revenue')->first();

        // 3. Data untuk Tabel Peringkat (Top 5 Services by Revenue)
        $topServices = Service::with(['orders' => function ($query) {
            $query->where('orders.created_at', '>=', Carbon::now()->subDays(7))
                ->where('orders.status', '!=', 'cancelled');
        }])
            ->get()
            ->map(function ($service) {
                $totalRevenue = $service->orders->sum(fn($order) => (float) $order->pivot->price_per_unit * (int) $order->pivot->quantity);
                $orderCount = $service->orders->count();
                return [
                    'id' => $service->id,
                    'serviceName' => $service->name,
                    'orderCount' => $orderCount,
                    'totalRevenue' => $totalRevenue,
                ];
            })
            ->where('orderCount', '>', 0) // Hanya tampilkan yang pernah dipesan
            ->sortByDesc('totalRevenue')
            ->take(5)
            ->values()
            ->map(function ($service, $index) {
                $service['rank'] = $index + 1;
                return $service;
            });

        if ($request->wantsJson()) {
            return response()->json($services);
        }

        return Inertia::render('Services', [
            'services' => $services,
            'filters' => $request->only(['search', 'type', 'fulfillment_type', 'offering_session', 'sort_by', 'sort_direction']),
            'insights' => [
                'mostPopular' => $mostPopularService,
                'highestRevenue' => $highestRevenueService,
                'topServices' => $topServices,
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateData($request);

        $service = Service::create([
            'name'             => $validated['name'],
            'description'      => $validated['description'] ?? null,
            'type'             => $validated['type'],
            'unit_name'        => $validated['type'] === 'per_unit' ? $validated['unit_name'] : null,
            'fulfillment_type' => $validated['fulfillment_type'],
            'offering_session' => $validated['offering_session'],
            // harga 0 untuk selectable (paket) dan free (komplementer)
            'price'            => in_array($validated['type'], ['selectable','free']) ? 0 : $validated['price'],
            'options'          => $validated['type'] === 'selectable' ? $validated['options'] : null,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Service created successfully.',
                'data'    => $service,
            ]);
        }

        return redirect()->back()->with('success', 'Service created successfully.');
    }

    public function update(Request $request, Service $service)
    {
        $validated = $this->validateData($request);

        $updateData = [
            'name'             => $validated['name'],
            'description'      => $validated['description'] ?? null,
            'type'             => $validated['type'],
            'unit_name'        => $validated['type'] === 'per_unit' ? $validated['unit_name'] : null,
            'fulfillment_type' => $validated['fulfillment_type'],
            'offering_session' => $validated['offering_session'],
            'price'            => in_array($validated['type'], ['selectable','free']) ? 0 : $validated['price'],
            'options'          => $validated['type'] === 'selectable' ? $validated['options'] : null,
        ];

        $service->update($updateData);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Service updated successfully.',
                'data'    => $service->fresh(),
            ]);
        }

        return redirect()->back()->with('success', 'Service updated successfully.');
    }

    public function destroy(Request $request, Service $service)
    {
        $service->delete();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Service deleted successfully.',
            ]);
        }

        return redirect()->back()->with('success', 'Service deleted successfully.');
    }

    private function validateData(Request $request)
    {
        // Log 4: Log data request di awal metode validasi
        Log::info('SERVICE VALIDATION START', [
            'request_data' => $request->all()
        ]);

        $rules = [
            'name'             => 'required|string|min:3',
            'description'      => 'nullable|string',
            // tambahkan 'free' ke daftar type
            'type'             => 'required|in:fixed,per_unit,selectable,free',
            'fulfillment_type' => 'required|in:direct,staff_assisted',
            'offering_session' => 'required|in:pre_checkin,post_checkin,pre_checkout',
        ];

        if ($request->type === 'per_unit') {
            $rules['price'] = 'required|numeric|min:0';
            $rules['unit_name'] = 'required|string|max:20';
        } elseif ($request->type === 'fixed') {
            $rules['price'] = 'required|numeric|min:0';
        } elseif ($request->type === 'selectable') {
            $rules['options'] = 'required|array|min:1';
            $rules['options.*.name'] = 'required|string';
            $rules['options.*.price'] = 'required|numeric|min:0';
        } elseif ($request->type === 'free') {
            // tidak ada rule tambahan; price akan dipaksa 0 di layer penyimpanan
        }

        $validatedData = $request->validate($rules);

        // Log 5: Log data yang berhasil melewati validasi
        Log::info('SERVICE VALIDATION SUCCESS', [
            'validated_data' => $validatedData
        ]);

        return $validatedData;
    }
}
