<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\RoomType;
use App\Services\RoomStatusService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        // Eager load roomType dengan kolom lengkap yang dibutuhkan di UI
        $query = Room::query()->with(['roomType:id,name,capacity,price_per_night']);

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
            // Urutkan berdasarkan nama tipe (sesuaikan alias agar tidak bentrok)
            $query->leftJoin('room_types', 'room_types.id', '=', 'rooms.room_type_id')
                  ->select('rooms.*', 'room_types.name as _room_type_name')
                  ->orderBy('_room_type_name', $sortDirection);
        } else {
            // Kolom lain langsung dari rooms
            $query->orderBy($sortBy, $sortDirection);
        }

        $rooms = $query->paginate(10)->withQueryString();

        // Daftar tipe untuk filter/form (lengkap agar konsisten UI)
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
        ]);

        $status = ($data['status'] ?? 'available') === 'maintenance' ? 'maintenance' : 'available';

        $room = Room::create([
            'room_number'  => $data['room_number'],
            'room_type_id' => $data['room_type_id'],
            'status'       => $status,
        ]);

        if ($status !== 'maintenance') {
            $roomSvc->recompute($room->id);
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

        foreach ($roomNumbers as $roomNumber) {
            $room = Room::create([
                'room_number'  => $roomNumber,
                'room_type_id' => $data['room_type_id'],
                'status'       => $status,
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
        ]);

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

        return Redirect::route('rooms.index')->with('success', 'Room updated successfully.');
    }

    public function destroy(Room $room)
    {
        if ($room->bookings()->whereIn('status', ['reserved', 'checked_in'])->exists()) {
            return Redirect::back()->with('error', 'Cannot delete room with active bookings.');
        }

        $room->delete();

        return Redirect::route('rooms.index')->with('success', 'Room deleted successfully.');
    }
}
