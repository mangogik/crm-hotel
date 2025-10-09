<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Services\RoomStatusService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        $query = Room::query();


        $query->when($request->input('search'), function ($q, $search) {
            $q->where('room_number', 'like', "%{$search}%")
                ->orWhere('room_type', 'like', "%{$search}%");
        });

        $query->when($request->input('status'), function ($q, $status) {
            $q->where('status', $status);
        });

        $query->when($request->input('room_type'), function ($q, $room_type) {
            $q->where('room_type', $room_type);
        });


        $sortBy = $request->input('sort_by', 'room_number');
        $sortDirection = $request->input('sort_direction', 'asc');
        $query->orderBy($sortBy, $sortDirection);

        $rooms = $query->paginate(10)->withQueryString();

        return Inertia::render('Rooms', [
            'rooms' => $rooms,
            'filters' => $request->only(['search', 'status', 'room_type', 'sort_by', 'sort_direction']),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    public function store(Request $request, RoomStatusService $roomSvc)
    {
        // Check if we're creating a range of rooms
        if ($request->input('is_range')) {
            return $this->storeRoomRange($request, $roomSvc);
        }
        
        // Original single room creation logic
        $data = $request->validate([
            'room_number' => 'required|string|max:255|unique:rooms',
            'room_type' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
            'price_per_night' => 'required|numeric|min:0',
            'status' => ['nullable', Rule::in(['available', 'occupied', 'maintenance'])],
        ]);

        // Paksa status awal: maintenance => maintenance, lainnya => available
        $status = ($data['status'] ?? 'available') === 'maintenance' ? 'maintenance' : 'available';
        $room = Room::create(array_merge($data, ['status' => $status]));

        // Kalau bukan maintenance, pastikan konsisten (akan jadi available)
        if ($status !== 'maintenance') {
            $roomSvc->recompute($room->id);
        }
        return Redirect::route('rooms.index')->with('success', 'Room created successfully.');
    }

    protected function storeRoomRange(Request $request, RoomStatusService $roomSvc)
    {
        $data = $request->validate([
            'start_room' => 'required|string|max:255',
            'end_room' => 'required|string|max:255',
            'room_type' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
            'price_per_night' => 'required|numeric|min:0',
            'status' => ['nullable', Rule::in(['available', 'occupied', 'maintenance'])],
        ]);

        $startRoom = $data['start_room'];
        $endRoom = $data['end_room'];
        
        // Generate room numbers
        $roomNumbers = $this->generateRoomNumbers($startRoom, $endRoom);
        
        // Check if any room already exists
        $existingRooms = Room::whereIn('room_number', $roomNumbers)->pluck('room_number')->toArray();
        if (!empty($existingRooms)) {
            return Redirect::back()->withErrors([
                'start_room' => 'The following rooms already exist: ' . implode(', ', $existingRooms)
            ])->withInput();
        }
        
        // Create rooms
        $status = ($data['status'] ?? 'available') === 'maintenance' ? 'maintenance' : 'available';
        $createdCount = 0;
        
        foreach ($roomNumbers as $roomNumber) {
            $room = Room::create([
                'room_number' => $roomNumber,
                'room_type' => $data['room_type'],
                'capacity' => $data['capacity'],
                'price_per_night' => $data['price_per_night'],
                'status' => $status,
            ]);
            
            if ($status !== 'maintenance') {
                $roomSvc->recompute($room->id);
            }
            
            $createdCount++;
        }
        
        return Redirect::route('rooms.index')->with('success', "{$createdCount} rooms created successfully.");
    }

    protected function generateRoomNumbers($start, $end)
    {
        // Extract numeric parts if room numbers have prefixes (e.g., A101, A102)
        $prefix = '';
        $numericStart = $start;
        $numericEnd = $end;
        
        // Check if room numbers have the same non-numeric prefix
        preg_match('/^([^\d]+)(\d+)$/', $start, $startMatches);
        preg_match('/^([^\d]+)(\d+)$/', $end, $endMatches);
        
        if (isset($startMatches[1]) && isset($endMatches[1]) && $startMatches[1] === $endMatches[1]) {
            $prefix = $startMatches[1];
            $numericStart = (int)$startMatches[2];
            $numericEnd = (int)$endMatches[2];
        } else {
            // Try to handle purely numeric room numbers
            if (is_numeric($start) && is_numeric($end)) {
                $numericStart = (int)$start;
                $numericEnd = (int)$end;
            } else {
                // Fallback: just return start and end if we can't parse
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
            'room_number' => ['required', 'string', 'max:255', Rule::unique('rooms')->ignore($room->id)],
            'room_type' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
            'price_per_night' => 'required|numeric|min:0',
            'status' => ['nullable', Rule::in(['available', 'occupied', 'maintenance'])],
        ]);

        $room->fill($data);

        if (($data['status'] ?? $room->status) === 'maintenance') {
            $room->status = 'maintenance';           // override
            $room->save();
        } else {
            $room->status = 'available';             // reset
            $room->save();
            $roomSvc->recompute($room->id);          // tentukan occupied/available real
        }

        return Redirect::route('rooms.index')->with('success', 'Room updated successfully.');
    }

    public function destroy(Room $room)
    {
        // Mencegah penghapusan jika ada booking aktif
        if ($room->bookings()->whereIn('status', ['reserved', 'checked_in'])->exists()) {
            return Redirect::back()->with('error', 'Cannot delete room with active bookings.');
        }

        $room->delete();

        return Redirect::route('rooms.index')->with('success', 'Room deleted successfully.');
    }
}