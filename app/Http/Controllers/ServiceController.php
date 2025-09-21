<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $type = $request->input('type');
        $fulfillmentType = $request->input('fulfillment_type');
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

        // Allowed sorts
        $allowedSorts = ['name', 'type', 'fulfillment_type', 'price', 'created_at'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }

        $services = $query->orderBy($sortBy, $sortDirection)
            ->paginate(10)
            ->withQueryString();

        // If the request expects JSON (API request)
        if ($request->wantsJson()) {
            return response()->json($services);
        }

        // Otherwise, return Inertia view (web request)
        return Inertia::render('Services', [
            'services' => $services,
            'filters' => [
                'search' => $search ?: '',
                'type' => $type ?: '',
                'fulfillment_type' => $fulfillmentType ?: '',
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
        $validated = $this->validateData($request);

        $service = Service::create([
            'name'             => $validated['name'],
            'description'      => $validated['description'] ?? null,
            'type'             => $validated['type'],
            'unit_name'        => $validated['type'] === 'per_unit' ? $validated['unit_name'] : null,
            'fulfillment_type' => $validated['fulfillment_type'],
            'price'            => $validated['type'] === 'selectable' ? 0 : $validated['price'],
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

        $service->update([
            'name'             => $validated['name'],
            'description'      => $validated['description'] ?? null,
            'type'             => $validated['type'],
            'unit_name'        => $validated['type'] === 'per_unit' ? $validated['unit_name'] : null,
            'fulfillment_type' => $validated['fulfillment_type'],
            'price'            => $validated['type'] === 'selectable' ? 0 : $validated['price'],
            'options'          => $validated['type'] === 'selectable' ? $validated['options'] : null,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Service updated successfully.',
                'data'    => $service,
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
        $rules = [
            'name'             => 'required|string|min:3',
            'description'      => 'nullable|string',
            'type'             => 'required|in:fixed,per_unit,selectable',
            'fulfillment_type' => 'required|in:direct,staff_assisted',
        ];

        if ($request->type === 'per_unit') {
            $rules['price'] = 'required|numeric|min:0';
            $rules['unit_name'] = 'required|string|max:20';
        } elseif ($request->type === 'fixed') {
            $rules['price'] = 'required|numeric|min:0';
        } else { // selectable
            $rules['options'] = 'required|array|min:1';
            $rules['options.*.name'] = 'required|string';
            $rules['options.*.price'] = 'required|numeric|min:0';
        }

        return $request->validate($rules);
    }
}