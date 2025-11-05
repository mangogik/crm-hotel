<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\RoomType;
use App\Models\RoomImage; // <-- Impor model gambar
use App\Services\RoomStatusService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB; // <-- Impor DB
use Illuminate\Support\Facades\Log; // <-- Impor Log
use Illuminate\Support\Facades\Storage; // <-- Impor Storage

class RoomController extends Controller
{
    public function index(Request $request)
    {
        // Eager load roomType dan images
        $query = Room::query()->with([
            'roomType:id,name,capacity,price_per_night',
            'images' // <-- Eager load relasi gambar
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

        // --- VALIDASI DIPERBARUI ---
        $data = $request->validate([
            'room_number'  => 'required|string|max:255|unique:rooms',
            'room_type_id' => 'required|exists:room_types,id',
            'status'       => ['nullable', Rule::in(['available', 'occupied', 'maintenance'])],
            
            // --- INI PERUBAHANNYA ---
            'images'       => 'required|array|min:1', // Wajib ada, minimal 1
            'images.*'     => 'required|image|mimes:jpeg,jpg,png,webp|max:2048', // Setiap file wajib image
        ]);

        DB::beginTransaction();
        try {
            $status = ($data['status'] ?? 'available') === 'maintenance' ? 'maintenance' : 'available';

            $room = Room::create([
                'room_number'  => $data['room_number'],
                'room_type_id' => $data['room_type_id'],
                'status'       => $status,
                // Slug akan dibuat otomatis oleh Model Room.php
            ]);

            // --- LOGIKA GAMBAR DITAMBAHKAN ---
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $file) {
                    if ($file instanceof \Illuminate\Http\UploadedFile) {
                        $path = $file->store('rooms', 'public'); // Simpan ke folder 'rooms'
                        RoomImage::create([
                            'room_id'    => $room->id,
                            'image_path' => $path,
                            'caption'    => null,
                        ]);
                    }
                }
            }
            // --- END LOGIKA GAMBAR ---

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
        // --- VALIDASI DIPERBARUI ---
        $data = $request->validate([
            'start_room'   => 'required|string|max:255',
            'end_room'     => 'required|string|max:255',
            'room_type_id' => 'required|exists:room_types,id',
            'status'       => ['nullable', Rule::in(['available', 'occupied', 'maintenance'])],

            // --- INI PERUBAHANNYA ---
            'images'       => 'required|array|min:1', // Wajib ada, minimal 1
            'images.*'     => 'required|image|mimes:jpeg,jpg,png,webp|max:2048', // Setiap file wajib image
        ]);

        $roomNumbers = $this->generateRoomNumbers($data['start_room'], $data['end_room']);

        // Cek duplikat
        $existingRooms = Room::whereIn('room_number', $roomNumbers)->pluck('room_number')->toArray();
        if (!empty($existingRooms)) {
            return Redirect::back()->withErrors([
                'start_room' => 'The following rooms already exist: ' . implode(', ', $existingRooms)
            ])->withInput();
        }

        $status = ($data['status'] ?? 'available') === 'maintenance' ? 'maintenance' : 'available';
        $createdCount = 0;

        // Siapkan file gambar sekali saja
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

                // Lampirkan gambar yang sama ke setiap kamar yang dibuat
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
        // Logika ini tetap sama
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
        // --- VALIDASI DIPERBARUI ---
        $data = $request->validate([
            'room_number'  => ['required', 'string', 'max:255', Rule::unique('rooms')->ignore($room->id)],
            'room_type_id' => 'required|exists:room_types,id',
            'status'       => ['nullable', Rule::in(['available', 'occupied', 'maintenance'])],
            
            // Validasi untuk update tetap nullable, karena user mungkin tidak ingin MENGUBAH gambar
            'images'       => 'nullable|array', 
            'images.*'     => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'images_to_delete' => 'nullable|array',
            'images_to_delete.*' => 'nullable|integer|exists:room_images,id', 
        ]);
        
        // --- LOGIKA BARU: Cek jika ini akan jadi tidak punya gambar ---
        $existingImageCount = $room->images()->count();
        $imagesToDeleteCount = is_array($data['images_to_delete'] ?? null) ? count($data['images_to_delete']) : 0;
        $newImagesCount = is_array($data['images'] ?? null) ? count($data['images']) : 0;

        if ($existingImageCount - $imagesToDeleteCount + $newImagesCount < 1) {
             // Jika update ini akan menghasilkan 0 gambar, kembalikan error
             // Kita tidak memberlakukan ini di 'store' karena sudah di-handle 'required'
            return Redirect::back()->withErrors([
                'images' => 'A room must have at least one image.'
            ])->withInput();
        }
        // --- END LOGIKA BARU ---


        DB::beginTransaction();
        try {
            $room->room_number  = $data['room_number'];
            $room->room_type_id = $data['room_type_id'];
            // Slug akan diupdate otomatis oleh Model jika room_number berubah

            if (($data['status'] ?? $room->status) === 'maintenance') {
                $room->status = 'maintenance';
                $room->save();
            } else {
                $room->status = 'available'; // Default ke available jika bukan maintenance
                $room->save();
                $roomSvc->recompute($room->id);
            }

            // --- LOGIKA GAMBAR DITAMBAHKAN ---

            // 1. Handle image deletions
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

            // 2. Handle new image uploads
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
            // --- END LOGIKA GAMBAR ---

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
            // Hapus semua file gambar dari storage
            foreach ($room->images as $img) {
                Storage::disk('public')->delete($img->image_path);
                // Record RoomImage akan terhapus otomatis oleh database (onDelete('cascade'))
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
}

