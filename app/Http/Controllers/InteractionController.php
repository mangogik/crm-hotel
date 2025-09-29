<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\BookingInteraction; // Pastikan model ini sudah Anda buat
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InteractionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'booking_id'        => 'required|exists:bookings,id',
            'interaction_type'  => 'required|string',
            'details'           => 'nullable|string',
            'metadata'          => 'nullable|array',
        ]);

        $interaction = BookingInteraction::create($validated);

        return response()->json([
            'message' => 'Interaction logged successfully',
            'interaction_id' => $interaction->id,
            'data' => $interaction
        ], 201);
    }
}
