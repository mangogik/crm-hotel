<?php

namespace App\Http\Controllers;

use App\Models\RoomType;
use Illuminate\Http\Request;

class RoomTypeController extends Controller
{
    /**
     * Store a new room type.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:255|unique:room_types,name',
            'capacity'         => 'required|integer|min:1',
            'price_per_night'  => 'required|numeric|min:0',
        ]);

        RoomType::create($data);

        return back()->with('success', 'Room type created.');
    }

    /**
     * Update an existing room type.
     */
    public function update(Request $request, RoomType $roomType)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:255|unique:room_types,name,' . $roomType->id,
            'capacity'         => 'required|integer|min:1',
            'price_per_night'  => 'required|numeric|min:0',
        ]);

        $roomType->update($data);

        return back()->with('success', 'Room type updated.');
    }

    /**
     * Delete a room type.
     */
    public function destroy(RoomType $roomType)
    {
        // OPTIONAL: Cegah hapus saat dipakai oleh room
        // if ($roomType->rooms()->exists()) {
        //     return back()->with('error', 'Cannot delete a room type that is in use.');
        // }

        $roomType->delete();

        return back()->with('success', 'Room type deleted.');
    }
}
