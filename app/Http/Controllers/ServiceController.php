<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServiceQuestion;
use App\Models\ServiceImage;
use App\Models\ServiceOptionImage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ServiceController extends Controller
{
    /**
     * Helper: normalisasi options agar selalu punya key, name, price.
     * - Dipakai saat store & update untuk tipe selectable / multiple_options
     */
    private function normalizeOptionsWithKeys($rawOptions)
    {
        if (!is_array($rawOptions)) {
            return [];
        }

        $normalized = [];
        foreach ($rawOptions as $idx => $opt) {
            $normalized[] = [
                'key'   => $opt['key']   ?? ('opt_' . ($idx + 1)),
                'name'  => $opt['name']  ?? ('Option ' . ($idx + 1)),
                'price' => $opt['price'] ?? 0,
            ];
        }

        return $normalized;
    }

    public function index(Request $request)
    {
        $search = $request->input('search');
        $type = $request->input('type');
        $fulfillmentType = $request->input('fulfillment_type');
        $offeringSession = $request->input('offering_session');
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

        if ($offeringSession && is_string($offeringSession)) {
            $query->where('offering_session', $offeringSession);
        }

        $allowedSorts = ['name', 'type', 'fulfillment_type', 'price', 'created_at', 'offering_session'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }

        $services = $query
            ->with([
                'activeQuestion',
                'images',
                'optionImages',
            ])
            ->orderBy($sortBy, $sortDirection)
            ->paginate(10)
            ->withQueryString();

        $services->getCollection()->transform(function ($service) {
            $service->has_active_questions = $service->activeQuestion !== null;
            $service->active_question = $service->activeQuestion;
            return $service;
        });

        // Insight cards
        $mostPopularService = Service::withCount('orders')
            ->orderBy('orders_count', 'desc')
            ->first();

        $servicesWithRevenue = Service::with('orders')->get()->map(function ($service) {
            $revenue = $service->orders->sum(
                fn($order) => ($order->pivot->price_per_unit ?? 0) * ($order->pivot->quantity ?? 0)
            );
            return ['name' => $service->name, 'revenue' => $revenue];
        });
        $highestRevenueService = $servicesWithRevenue->sortByDesc('revenue')->first();

        $topServices = Service::with(['orders' => function ($query) {
            $query->where('orders.created_at', '>=', Carbon::now()->subDays(7))
                ->where('orders.status', '!=', 'cancelled');
        }])
            ->get()
            ->map(function ($service) {
                $totalRevenue = $service->orders->sum(
                    fn($order) =>
                    (float) $order->pivot->price_per_unit * (int) $order->pivot->quantity
                );
                $orderCount = $service->orders->count();
                return [
                    'id' => $service->id,
                    'serviceName' => $service->name,
                    'orderCount' => $orderCount,
                    'totalRevenue' => $totalRevenue,
                ];
            })
            ->where('orderCount', '>', 0)
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

        DB::beginTransaction();
        try {
            // Normalisasi options (kalau tipe selectable/multiple_options)
            $optionsNormalized = null;
            if (in_array($validated['type'], ['selectable', 'multiple_options'])) {
                $optionsNormalized = $this->normalizeOptionsWithKeys($validated['options']);
            }

            $service = Service::create([
                'name'             => $validated['name'],
                'description'      => $validated['description'] ?? null,
                'type'             => $validated['type'],
                'unit_name'        => $validated['type'] === 'per_unit' ? $validated['unit_name'] : null,
                'fulfillment_type' => $validated['fulfillment_type'],
                'offering_session' => $validated['offering_session'],
                'price'            => in_array($validated['type'], ['selectable', 'free', 'multiple_options']) ? 0 : $validated['price'],
                'options'          => in_array($validated['type'], ['selectable', 'multiple_options'])
                    ? $optionsNormalized
                    : null,
            ]);

            // Questions
            if ($request->has('has_questions') && $request->has_questions) {
                $questions = $request->input('questions', []);
                $questions = array_filter($questions, fn($q) => !empty(trim($q)));

                if (!empty($questions)) {
                    ServiceQuestion::createNewVersion($service->id, $questions);
                }
            }

            // Service-level images[] (general)
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $file) {
                    if ($file instanceof \Illuminate\Http\UploadedFile) {
                        $path = $file->store('services', 'public');
                        ServiceImage::create([
                            'service_id' => $service->id,
                            'image_path' => $path,
                            'caption'    => null,
                        ]);
                    }
                }
            }

            // Option-level images: option_images[opt_key] = file
            if (in_array($service->type, ['selectable', 'multiple_options']) && $request->hasFile('option_images')) {
                $optionMap = collect($service->options ?? [])->keyBy('key');

                foreach ($request->file('option_images') as $optionKey => $file) {
                    if ($file instanceof \Illuminate\Http\UploadedFile) {
                        $path = $file->store('services/options', 'public');

                        $optionName = optional($optionMap->get($optionKey))['name'] ?? $optionKey;

                        ServiceOptionImage::create([
                            'service_id'  => $service->id,
                            'option_key'  => $optionKey,
                            'option_name' => $optionName,
                            'image_path'  => $path,
                            'caption'     => null,
                        ]);
                    }
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Service creation failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Failed to create service. Please try again.'], 500);
            }

            return redirect()->back()->with('error', 'Failed to create service. Please try again.');
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => 'Service created successfully.', 'data' => $service]);
        }

        return redirect()
            ->route('services.index')
            ->with('success', 'Service created successfully.');
    }

    public function update(Request $request, Service $service)
    {
        // VALIDATE (now includes file size/type rules)
        Log::info('SERVICE VALIDATION START', ['request_data' => $request->all()]);
        $validated = $this->validateData($request);
        Log::info('SERVICE VALIDATION SUCCESS', ['validated_data' => $validated]);

        DB::beginTransaction();
        try {
            /**
             * 1. Update core service data
             */
            $optionsNormalized = null;
            if (in_array($validated['type'], ['selectable', 'multiple_options'])) {
                $optionsNormalized = $this->normalizeOptionsWithKeys($validated['options']);
            }

            $updateData = [
                'name'             => $validated['name'],
                'description'      => $validated['description'] ?? null,
                'type'             => $validated['type'],
                'unit_name'        => $validated['type'] === 'per_unit' ? $validated['unit_name'] : null,
                'fulfillment_type' => $validated['fulfillment_type'],
                'offering_session' => $validated['offering_session'],
                'price'            => in_array($validated['type'], ['selectable', 'free', 'multiple_options'])
                    ? 0
                    : $validated['price'],
                'options'          => in_array($validated['type'], ['selectable', 'multiple_options'])
                    ? $optionsNormalized
                    : null,
            ];

            $service->update($updateData);

            /**
             * 2. Questions
             */
            if ($request->has('has_questions')) {
                if ($request->has_questions) {
                    $questions = $request->input('questions', []);
                    $questions = array_filter($questions, fn($q) => !empty(trim($q)));

                    if (!empty($questions)) {
                        ServiceQuestion::createNewVersion($service->id, $questions);
                    } else {
                        ServiceQuestion::where('service_id', $service->id)->update(['is_active' => false]);
                    }
                } else {
                    ServiceQuestion::where('service_id', $service->id)->update(['is_active' => false]);
                }
            }

            /**
             * 3. DELETE selected general images (partial delete)
             */
            if ($request->filled('images_to_delete') && is_array($request->images_to_delete)) {
                $toDeleteGeneral = ServiceImage::where('service_id', $service->id)
                    ->whereIn('id', $request->images_to_delete)
                    ->get();

                foreach ($toDeleteGeneral as $img) {
                    Storage::disk('public')->delete($img->image_path);
                    $img->delete();
                }
            }

            /**
             * 4. APPEND new general images (gallery)
             *    - old images stay unless explicitly deleted
             */
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $file) {
                    if ($file instanceof \Illuminate\Http\UploadedFile) {
                        $path = $file->store('services', 'public');
                        ServiceImage::create([
                            'service_id' => $service->id,
                            'image_path' => $path,
                            'caption'    => null,
                        ]);
                    }
                }
            }

            /**
             * 5. DELETE selected option images (partial delete)
             */
            if ($request->filled('option_images_to_delete') && is_array($request->option_images_to_delete)) {
                $toDeleteOption = ServiceOptionImage::where('service_id', $service->id)
                    ->whereIn('id', $request->option_images_to_delete)
                    ->get();

                foreach ($toDeleteOption as $oi) {
                    Storage::disk('public')->delete($oi->image_path);
                    $oi->delete();
                }
            }

            /**
             * 6. APPEND new per-option images
             *    We still accept uploads as "option_images_new[<optionKey>] = file"
             *    We'll then enforce only ONE image per option.
             */
            $newOptionKeysUploaded = [];

            if (
                in_array($service->type, ['selectable', 'multiple_options'])
                && $request->hasFile('option_images_new')
            ) {
                $serviceFreshOptions = $service->fresh()->options ?? [];
                $optionMap = collect($serviceFreshOptions)->keyBy('key');

                foreach ($request->file('option_images_new') as $optionKey => $file) {
                    if ($file instanceof \Illuminate\Http\UploadedFile) {
                        $path = $file->store('services/options', 'public');

                        $optionName = optional($optionMap->get($optionKey))['name'] ?? $optionKey;

                        ServiceOptionImage::create([
                            'service_id'  => $service->id,
                            'option_key'  => $optionKey,
                            'option_name' => $optionName,
                            'image_path'  => $path,
                            'caption'     => null,
                        ]);

                        $newOptionKeysUploaded[] = $optionKey;
                    }
                }
            }

            /**
             * 6b. Enforce single image per option_key.
             * Keep newest, delete the rest.
             */
            if (!empty($newOptionKeysUploaded)) {
                $uniqueKeys = array_unique($newOptionKeysUploaded);

                foreach ($uniqueKeys as $optKey) {
                    $allForKey = ServiceOptionImage::where('service_id', $service->id)
                        ->where('option_key', $optKey)
                        ->orderByDesc('id')
                        ->get();

                    $keepFirst = true;
                    foreach ($allForKey as $img) {
                        if ($keepFirst) {
                            $keepFirst = false;
                            continue;
                        }

                        Storage::disk('public')->delete($img->image_path);
                        $img->delete();
                    }
                }
            }

            DB::commit();
            Log::info('SERVICE UPDATE SUCCESS', ['service_id' => $service->id]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Service update failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update service. Please try again.',
                ], 500);
            }

            return redirect()
                ->back()
                ->with('error', 'Failed to update service. Please try again.');
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Service updated successfully.',
                'data'    => $service->fresh(['images', 'optionImages']),
            ]);
        }

        return redirect()
            ->route('services.index')
            ->with('success', 'Service updated successfully.');
    }

    public function destroy(Request $request, Service $service)
    {
        // optional: hapus file storage juga
        foreach ($service->images as $img) {
            Storage::disk('public')->delete($img->image_path);
        }
        foreach ($service->optionImages as $oi) {
            Storage::disk('public')->delete($oi->image_path);
        }

        $service->delete();

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => 'Service deleted successfully.']);
        }

        return redirect()
            ->route('services.index')
            ->with('success', 'Service deleted successfully.');
    }

    private function validateData(Request $request)
    {
        Log::info('SERVICE VALIDATION START', ['request_data' => $request->all()]);

        $rules = [
            'name'             => 'required|string|min:3',
            'description'      => 'nullable|string',
            'type'             => 'required|in:fixed,per_unit,selectable,free,multiple_options',
            'fulfillment_type' => 'required|in:direct,staff_assisted',
            'offering_session' => 'required|in:pre_checkin,post_checkin,pre_checkout',

            // gallery images (append)
            // enforce: image file, allowed mimes, <= 2MB
            'images'                      => 'nullable|array',
            'images.*'                    => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',

            // legacy (store): option_images[optionKey]
            'option_images'               => 'nullable|array',
            'option_images.*'             => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',

            // update: option_images_new[optionKey]
            'option_images_new'           => 'nullable|array',
            'option_images_new.*'         => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',

            // delete lists
            'images_to_delete'            => 'nullable|array',
            'images_to_delete.*'          => 'integer',

            'option_images_to_delete'     => 'nullable|array',
            'option_images_to_delete.*'   => 'integer',
        ];

        if ($request->type === 'per_unit') {
            $rules['price'] = 'required|numeric|min:0';
            $rules['unit_name'] = 'required|string|max:20';
        } elseif ($request->type === 'fixed') {
            $rules['price'] = 'required|numeric|min:0';
        } elseif (in_array($request->type, ['selectable', 'multiple_options'])) {
            $rules['options'] = 'required|array|min:1';
            $rules['options.*.name'] = 'required|string';
            $rules['options.*.price'] = 'required|numeric|min:0';
            $rules['options.*.key'] = 'nullable|string';
        }

        $validatedData = $request->validate($rules);

        Log::info('SERVICE VALIDATION SUCCESS', ['validated_data' => $validatedData]);

        return $validatedData;
    }

    public function getImages(Service $service)
    {
        $service->load([
            'images',
            'optionImages',
        ]);

        return response()->json([
            'id'           => $service->id,
            'name'         => $service->name,
            'type'         => $service->type,

            'images'       => $service->images->map(function ($img) {
                return [
                    'id'         => $img->id,
                    'image_path' => $img->image_path,
                    'caption'    => $img->caption,
                    'url'        => asset('storage/' . $img->image_path),
                ];
            })->values(),

            'optionImages' => $service->optionImages->map(function ($img) {
                return [
                    'id'          => $img->id,
                    'option_key'  => $img->option_key,
                    'option_name' => $img->option_name,
                    'image_path'  => $img->image_path,
                    'caption'     => $img->caption,
                    'url'         => asset('storage/' . $img->image_path),
                ];
            })->values(),
        ]);
    }

    public function getQuestions(Service $service)
    {
        $activeQuestion = $service->activeQuestion;
        if (!$activeQuestion) {
            return response()->json([]);
        }
        return response()->json($activeQuestion->questions_json);
    }
}
