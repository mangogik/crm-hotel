<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;

class RoomController extends Controller
{

    public function index(Request $request)
    {
        $query = Room::query();

        // Logika Filter
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

        // Logika Sorting
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

    public function store(Request $request)
    {
        $data = $request->validate([
            'room_number' => 'required|string|max:255|unique:rooms',
            'room_type' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
            'price_per_night' => 'required|numeric|min:0',
            'status' => ['required', Rule::in(['available', 'occupied', 'maintenance'])],
        ]);

        Room::create($data);
        
        return Redirect::route('rooms.index')->with('success', 'Room created successfully.');
    }

    public function update(Request $request, Room $room)
    {
        $data = $request->validate([
            'room_number' => ['required', 'string', 'max:255', Rule::unique('rooms')->ignore($room->id)],
            'room_type' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
            'price_per_night' => 'required|numeric|min:0',
            'status' => ['required', Rule::in(['available', 'occupied', 'maintenance'])],
        ]);

        $room->update($data);

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
