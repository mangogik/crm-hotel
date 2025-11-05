<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServiceCategory;
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
     * Helper: normalize options so they always have key, name, price.
     */
    private function normalizeOptionsWithKeys($rawOptions)
    {
        if (!is_array($rawOptions)) {
            return [];
        }

        $normalized = [];
        foreach ($rawOptions as $idx => $opt) {
            $normalized[] = [
                'key'   => $opt['key']   ?? ('opt_' . ($idx + 1)), // ✅ Perbaikan di sini
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
        $categoryId = $request->input('category_id');
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = in_array(strtolower($request->input('sort_direction', 'desc')), ['asc', 'desc'])
            ? $request->input('sort_direction', 'desc')
            : 'desc';

        $query = Service::query()->with(['category', 'activeQuestion', 'images', 'optionImages']);

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

        if ($categoryId && is_numeric($categoryId)) {
            $query->where('category_id', $categoryId);
        }

        $allowedSorts = ['name', 'type', 'fulfillment_type', 'price', 'created_at', 'offering_session'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }

        $services = $query
            ->orderBy($sortBy, $sortDirection)
            ->paginate(10)
            ->withQueryString();

        $services->getCollection()->transform(function ($service) {
            $service->has_active_questions = $service->activeQuestion !== null;
            $service->active_question = $service->activeQuestion;
            return $service;
        });

        // Insights (kept intact)
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

        $categories = ServiceCategory::withCount('services')->orderBy('name')->get();

        if ($request->wantsJson()) {
            return response()->json($services);
        }

        return Inertia::render('Services', [
            'services' => $services,
            'categories' => $categories,
            'filters' => $request->only([
                'search',
                'type',
                'fulfillment_type',
                'offering_session',
                'category_id',
                'sort_by',
                'sort_direction',
            ]),
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

    public function create()
    {
        // Fetch categories to pass to the create form dropdown
        $categories = ServiceCategory::orderBy('name')->get();

        return Inertia::render('Services/Create', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateData($request);

        DB::beginTransaction();
        try {
            $optionsNormalized = null;
            if (in_array($validated['type'], ['selectable', 'multiple_options'])) {
                $optionsNormalized = $this->normalizeOptionsWithKeys($validated['options']);
            }

            $service = Service::create([
                'category_id'     => $validated['category_id'] ?? null,
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

            // General images
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

            // Option images
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
            return redirect()->back()->with('error', 'Failed to create service. Please try again.');
        }

        return redirect()
            ->route('services.index')
            ->with('success', 'Service created successfully.');
    }

    // --- FILE BARU ---
    // Method ini akan dipanggil oleh rute GET /services/{service}/edit
    // untuk menampilkan halaman form edit.
    public function edit(Service $service)
    {
        // Make sure to load all relationships including optionImages
        $service->load(['category', 'activeQuestion', 'images', 'optionImages']);

        // Debug log to check option images
        Log::info('Service edit data', [
            'service_id' => $service->id,
            'options' => $service->options,
            'option_images' => $service->optionImages->toArray()
        ]);

        $categories = ServiceCategory::orderBy('name')->get();

        return Inertia::render('Services/Edit', [
            'service' => $service,
            'categories' => $categories,
        ]);
    }
    // --- AKHIR FILE BARU ---

    public function update(Request $request, Service $service)
    {
        // Log 1: Data mentah dari request
        Log::info('SERVICE_UPDATE: Raw request data.', $request->all());

        $validated = $this->validateData($request);

        // Log 2: Data setelah validasi
        Log::info('SERVICE_UPDATE: Validated data.', $validated);

        DB::beginTransaction();
        try {
            $optionsNormalized = null;
            if (in_array($validated['type'], ['selectable', 'multiple_options'])) {
                $optionsNormalized = $this->normalizeOptionsWithKeys($validated['options']);
            }

            // --- PERBAIKAN LOGIKA UPDATE ---
            // Pisahkan data utama dari data yang mungkin tidak ada (nullable foreign key)
            $updateData = [
                // 'category_id' sengaja dihilangkan dari sini
                'name'              => $validated['name'],
                'description'       => $validated['description'] ?? null,
                'type'              => $validated['type'],
                'unit_name'         => $validated['type'] === 'per_unit' ? $validated['unit_name'] : null,
                'fulfillment_type'  => $validated['fulfillment_type'],
                'offering_session'  => $validated['offering_session'],
                'price'             => in_array($validated['type'], ['selectable', 'free', 'multiple_options'])
                    ? 0
                    : $validated['price'],
                'options'           => in_array($validated['type'], ['selectable', 'multiple_options'])
                    ? $optionsNormalized
                    : null,
            ];

            // Hanya perbarui category_id jika kunci 'category_id' ada di data yang divalidasi
            // Ini mencegah 'category_id' terhapus (menjadi null) jika tidak dikirim dari form
            if (array_key_exists('category_id', $validated)) {
                $updateData['category_id'] = $validated['category_id']; // Ini bisa null (jika "No Category") atau ID
            }
            // --- END PERBAIKAN ---

            // Log 3: Data final yang akan di-update
            Log::info('SERVICE_UPDATE: Final data for update.', $updateData);

            $service->update($updateData);

            // Update questions
            if ($request->has('has_questions') && $request->input('has_questions') == '1') {
                $questions = $request->input('questions', []);
                $questions = array_filter($questions, fn($q) => !empty(trim($q)));

                if (!empty($questions)) {
                    ServiceQuestion::createNewVersion($service->id, $questions);
                } else {
                    // Jika 'has_questions' true tapi array 'questions' kosong, hapus yang lama
                    Log::info('SERVICE_UPDATE: has_questions is true but no questions provided, deleting old ones.');
                    $service->serviceQuestions()->update(['is_active' => false]);
                }
            } else {
                // Jika has_questions adalah false (atau 0), nonaktifkan semua
                Log::info('SERVICE_UPDATE: has_questions is false, deactivating all questions.');
                $service->serviceQuestions()->update(['is_active' => false]);
            }


            // Handle image deletions
            if ($request->has('images_to_delete')) {
                $imagesToDelete = $request->input('images_to_delete');
                if (is_array($imagesToDelete)) {
                    Log::info('SERVICE_UPDATE: Deleting general images.', $imagesToDelete);
                    foreach ($imagesToDelete as $imageId) {
                        $image = ServiceImage::find($imageId);
                        if ($image && $image->service_id == $service->id) {
                            Storage::disk('public')->delete($image->image_path);
                            $image->delete();
                        }
                    }
                }
            }

            if ($request->has('option_images_to_delete')) {
                $optionImagesToDelete = $request->input('option_images_to_delete');
                if (is_array($optionImagesToDelete)) {
                    Log::info('SERVICE_UPDATE: Deleting option images.', $optionImagesToDelete);
                    foreach ($optionImagesToDelete as $imageId) {
                        $image = ServiceOptionImage::find($imageId);
                        if ($image && $image->service_id == $service->id) {
                            Storage::disk('public')->delete($image->image_path);
                            $image->delete();
                        }
                    }
                }
            }

            // Handle new image uploads
            if ($request->hasFile('images')) {
                Log::info('SERVICE_UPDATE: Uploading new general images.');
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

            // Handle new option image uploads
            if (in_array($service->type, ['selectable', 'multiple_options']) && $request->hasFile('option_images_new')) {
                Log::info('SERVICE_UPDATE: Uploading new option images.');
                $optionMap = collect($service->options ?? [])->keyBy('key');
                foreach ($request->file('option_images_new') as $optionKey => $file) {
                    if ($file instanceof \Illuminate\Http\UploadedFile) {
                        // Hapus dulu gambar lama di key/posisi yang sama
                        $existingImage = ServiceOptionImage::where('service_id', $service->id)
                            ->where('option_key', $optionKey)
                            ->first();
                        if ($existingImage) {
                            Log::info('SERVICE_UPDATE: Deleting old option image for key ' . $optionKey);
                            Storage::disk('public')->delete($existingImage->image_path);
                            $existingImage->delete();
                        }

                        // Buat gambar baru
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
            Log::info('SERVICE_UPDATE: Update successful for service ID ' . $service->id);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Service update failed: ' . $e->getMessage(), [
                'service_id' => $service->id,
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect()->back()->with('error', 'Failed to update service. Please try again.');
        }

        return redirect()
            ->route('services.index')
            ->with('success', 'Service updated successfully.');
    }

    public function destroy(Request $request, Service $service)
    {
        foreach ($service->images as $img) {
            Storage::disk('public')->delete($img->image_path);
        }
        foreach ($service->optionImages as $oi) {
            Storage::disk('public')->delete($oi->image_path);
        }

        $service->delete();

        return redirect()
            ->route('services.index')
            ->with('success', 'Service deleted successfully.');
    }

    private function validateData(Request $request)
    {
        Log::info('SERVICE VALIDATION START', ['request_data' => $request->all()]);

        $rules = [
            'category_id'      => 'nullable|exists:service_categories,id',
            'name'             => 'required|string|min:3',
            'description'      => 'nullable|string',
            'type'             => 'required|in:fixed,per_unit,selectable,free,multiple_options',
            'fulfillment_type' => 'required|in:direct,staff_assisted',
            'offering_session' => 'required|in:pre_checkin,post_checkin,pre_checkout',
            'images'           => 'nullable|array',
            'images.*'         => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'option_images'    => 'nullable|array',
            'option_images.*'  => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
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

        return $request->validate($rules);
    }

    public function getImages(Service $service)
    {
        $service->load(['images', 'optionImages']);
        return response()->json([
            'id' => $service->id,
            'name' => $service->name,
            'images' => $service->images,
            'optionImages' => $service->optionImages,
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
