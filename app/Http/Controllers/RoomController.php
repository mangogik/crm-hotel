<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\RoomType;
use App\Models\RoomImage;
use App\Services\RoomStatusService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage; // Pastikan Storage di-import

class RoomController extends Controller
{
    public function index(Request $request)
    {
        // Eager load roomType dan images
        $query = Room::query()->with([
            'roomType:id,name,capacity,price_per_night',
            'images' // <-- Hanya eager load relasi gambar room
            // 'roomType.images' <-- DIHAPUS KARENA MENYEBABKAN ERROR
        ]);

        // Search: room_number atau nama room type
        $query->when($request->input('search'), function ($q, $search) {
            $q->where('room_number', 'like', "%{$search}%")
                ->orWhereHas('roomType', function ($qr) use ($search) {
                    $qr->where('name', 'like', "%{$search}%");
                });
        });

        // Filter status
        $query->when($request->input('status'), function ($q, $status) {
            $q->where('status', $status);
        });

        // Filter by room_type_id
        $query->when($request->input('room_type_id'), function ($q, $roomTypeId) {
            $q->where('room_type_id', $roomTypeId);
        });

        // Sorting
        $sortBy = $request->input('sort_by', 'room_number');
        $sortDirection = $request->input('sort_direction', 'asc');

        if ($sortBy === 'room_type') {
            $query->leftJoin('room_types', 'room_types.id', '=', 'rooms.room_type_id')
                ->select('rooms.*', 'room_types.name as _room_type_name')
                ->orderBy('_room_type_name', $sortDirection);
        } else {
            $query->orderBy($sortBy, $sortDirection);
        }

        $rooms = $query->paginate(10)->withQueryString();

        $roomTypes = RoomType::orderBy('name')
            ->get(['id', 'name', 'capacity', 'price_per_night']);

        return Inertia::render('Rooms', [
            'rooms' => $rooms,
            'roomTypes' => $roomTypes,
            'filters' => $request->only(['search', 'status', 'room_type_id', 'sort_by', 'sort_direction']),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    public function store(Request $request, RoomStatusService $roomSvc)
    {
        // Bulk create?
        if ($request->boolean('is_range')) {
            return $this->storeRoomRange($request, $roomSvc);
        }

        $data = $request->validate([
            'room_number'  => 'required|string|max:255|unique:rooms',
            'room_type_id' => 'required|exists:room_types,id',
            'status'       => ['nullable', Rule::in(['available', 'occupied', 'maintenance'])],
            'images'       => 'required|array|min:1',
            'images.*'     => 'required|image|mimes:jpeg,jpg,png,webp|max:2048',
        ]);

        DB::beginTransaction();
        try {
            $status = ($data['status'] ?? 'available') === 'maintenance' ? 'maintenance' : 'available';

            $room = Room::create([
                'room_number'  => $data['room_number'],
                'room_type_id' => $data['room_type_id'],
                'status'       => $status,
            ]);

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $file) {
                    if ($file instanceof \Illuminate\Http\UploadedFile) {
                        $path = $file->store('rooms', 'public');
                        RoomImage::create([
                            'room_id'    => $room->id,
                            'image_path' => $path,
                            'caption'    => null,
                        ]);
                    }
                }
            }

            if ($status !== 'maintenance') {
                $roomSvc->recompute($room->id);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Room creation failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'Failed to create room. Please try again.');
        }

        return Redirect::route('rooms.index')->with('success', 'Room created successfully.');
    }

    protected function storeRoomRange(Request $request, RoomStatusService $roomSvc)
    {
        $data = $request->validate([
            'start_room'   => 'required|string|max:255',
            'end_room'     => 'required|string|max:255',
            'room_type_id' => 'required|exists:room_types,id',
            'status'       => ['nullable', Rule::in(['available', 'occupied', 'maintenance'])],
            'images'       => 'required|array|min:1',
            'images.*'     => 'required|image|mimes:jpeg,jpg,png,webp|max:2048',
        ]);

        $roomNumbers = $this->generateRoomNumbers($data['start_room'], $data['end_room']);

        $existingRooms = Room::whereIn('room_number', $roomNumbers)->pluck('room_number')->toArray();
        if (!empty($existingRooms)) {
            return Redirect::back()->withErrors([
                'start_room' => 'The following rooms already exist: ' . implode(', ', $existingRooms)
            ])->withInput();
        }

        $status = ($data['status'] ?? 'available') === 'maintenance' ? 'maintenance' : 'available';
        $createdCount = 0;

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                if ($file instanceof \Illuminate\Http\UploadedFile) {
                    $imagePaths[] = $file->store('rooms', 'public');
                }
            }
        }

        DB::beginTransaction();
        try {
            foreach ($roomNumbers as $roomNumber) {
                $room = Room::create([
                    'room_number'  => $roomNumber,
                    'room_type_id' => $data['room_type_id'],
                    'status'       => $status,
                ]);

                if (!empty($imagePaths)) {
                    foreach ($imagePaths as $path) {
                        RoomImage::create([
                            'room_id'    => $room->id,
                            'image_path' => $path,
                            'caption'    => null,
                        ]);
                    }
                }

                if ($status !== 'maintenance') {
                    $roomSvc->recompute($room->id);
                }
                $createdCount++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Room range creation failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'Failed to create room range. Please try again.');
        }

        return Redirect::route('rooms.index')->with('success', "{$createdCount} rooms created successfully.");
    }

    protected function generateRoomNumbers($start, $end)
    {
        $prefix = '';
        $numericStart = $start;
        $numericEnd = $end;

        preg_match('/^([^\d]+)(\d+)$/', $start, $startMatches);
        preg_match('/^([^\d]+)(\d+)$/', $end, $endMatches);

        if (isset($startMatches[1]) && isset($endMatches[1]) && $startMatches[1] === $endMatches[1]) {
            $prefix = $startMatches[1];
            $numericStart = (int) $startMatches[2];
            $numericEnd = (int) $endMatches[2];
        } else {
            if (is_numeric($start) && is_numeric($end)) {
                $numericStart = (int) $start;
                $numericEnd = (int) $end;
            } else {
                return [$start, $end];
            }
        }

        $roomNumbers = [];
        for ($i = $numericStart; $i <= $numericEnd; $i++) {
            $roomNumbers[] = $prefix . $i;
        }

        return $roomNumbers;
    }

    public function update(Request $request, Room $room, RoomStatusService $roomSvc)
    {
        $data = $request->validate([
            'room_number'  => ['required', 'string', 'max:255', Rule::unique('rooms')->ignore($room->id)],
            'room_type_id' => 'required|exists:room_types,id',
            'status'       => ['nullable', Rule::in(['available', 'occupied', 'maintenance'])],
            'images'       => 'nullable|array', 
            'images.*'     => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'images_to_delete' => 'nullable|array',
            'images_to_delete.*' => 'nullable|integer|exists:room_images,id', 
        ]);
        
        $existingImageCount = $room->images()->count();
        $imagesToDeleteCount = is_array($data['images_to_delete'] ?? null) ? count($data['images_to_delete']) : 0;
        $newImagesCount = is_array($data['images'] ?? null) ? count($data['images']) : 0;

        if ($existingImageCount - $imagesToDeleteCount + $newImagesCount < 1) {
             return Redirect::back()->withErrors([
                'images' => 'A room must have at least one image.'
            ])->withInput();
        }

        DB::beginTransaction();
        try {
            $room->room_number  = $data['room_number'];
            $room->room_type_id = $data['room_type_id'];

            if (($data['status'] ?? $room->status) === 'maintenance') {
                $room->status = 'maintenance';
                $room->save();
            } else {
                $room->status = 'available';
                $room->save();
                $roomSvc->recompute($room->id);
            }

            if ($request->has('images_to_delete')) {
                $imagesToDelete = $request->input('images_to_delete');
                if (is_array($imagesToDelete)) {
                    foreach ($imagesToDelete as $imageId) {
                        $image = RoomImage::find($imageId);
                        if ($image && $image->room_id == $room->id) {
                            Storage::disk('public')->delete($image->image_path);
                            $image->delete();
                        }
                    }
                }
            }

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $file) {
                    if ($file instanceof \Illuminate\Http\UploadedFile) {
                        $path = $file->store('rooms', 'public');
                        RoomImage::create([
                            'room_id'    => $room->id,
                            'image_path' => $path,
                            'caption'    => null,
                        ]);
                    }
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Room update failed: ' . $e->getMessage(), ['room_id' => $room->id, 'trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'Failed to update room. Please try again.');
        }

        return Redirect::route('rooms.index')->with('success', 'Room updated successfully.');
    }

    public function destroy(Room $room)
    {
        if ($room->bookings()->whereIn('status', ['reserved', 'checked_in'])->exists()) {
            return Redirect::back()->with('error', 'Cannot delete room with active bookings.');
        }

        DB::beginTransaction();
        try {
            foreach ($room->images as $img) {
                Storage::disk('public')->delete($img->image_path);
            }
            $room->delete();
            DB::commit();
        } catch (\Exception $e) {
             DB::rollBack();
            Log::error('Room deletion failed: ' . $e->getMessage(), ['room_id' => $room->id, 'trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'Failed to delete room. Please try again.');
        }

        return Redirect::route('rooms.index')->with('success', 'Room deleted successfully.');
    }

    /**
     * API endpoint untuk mengambil gambar untuk satu ruangan.
     */
public function images(Room $room)
{
    try {
        // Pastikan relasi dimuat
        $room->load('images');

        // Log total gambar ditemukan
        Log::info("Fetching images for Room ID {$room->id}", [
            'total_images' => $room->images->count(),
        ]);

        // Jika tidak ada gambar sama sekali
        if ($room->images->isEmpty()) {
            Log::warning("No images found for Room ID {$room->id}");
        }

        // Mapping data gambar
        $images = $room->images->map(function ($img) {
            $url = $img->url; // Gunakan accessor, bukan getUrl()
            Log::debug("RoomImage loaded", [
                'id' => $img->id,
                'path' => $img->image_path,
                'generated_url' => $url,
            ]);

            return [
                'id' => $img->id,
                'url' => $url,
                'caption' => $img->caption,
            ];
        });

        // Log hasil akhir JSON sebelum dikirim
        Log::info("Returning JSON for Room ID {$room->id}", [
            'room_images' => $images,
        ]);

        return response()->json([
            'room_images' => $images,
            'room_type_images' => [], // Kosong by design
        ]);
    } catch (\Exception $e) {
        Log::error("Error in RoomController@images for Room ID {$room->id}: " . $e->getMessage(), [
            'trace' => $e->getTraceAsString(),
        ]);

        return response()->json([
            'error' => 'Failed to fetch images.',
        ], 500);
    }
}

}