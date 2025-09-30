<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Booking;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function storeFromBot(Request $request)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'rating'     => 'required|integer|between:1,5',
            'comment'    => 'nullable|string',
        ]);

        $booking = Booking::find($validated['booking_id']);

        Review::create([
            'customer_id' => $booking->customer_id,
            'booking_id'  => $validated['booking_id'],
            'rating'      => $validated['rating'],
            'comment'     => $validated['comment'],
            'review_date' => now(),
        ]);

        return response()->json(['message' => 'Review saved successfully'], 201);
    }
}