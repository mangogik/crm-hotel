<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Booking;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $search        = (string) $request->input('search', '');
        $dateFrom      = $request->input('date_from');
        $dateTo        = $request->input('date_to');

        // --- Rating filters (with backward compatibility) ---
        $ratingMode = $request->input('rating_mode'); // 'eq' | 'gte' | 'range' | null
        $rating     = $request->input('rating');      // for 'eq'
        $minRating  = $request->input('min_rating');  // for 'gte' & 'range'
        $maxRating  = $request->input('max_rating');  // for 'range'

        $sortBy        = $request->input('sort_by', 'created_at');
        $sortDirection = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = Review::query()
            ->with(['customer:id,name,passport_country,email,phone'])
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('comment', 'like', "%{$search}%")
                        ->orWhereHas('customer', function ($cq) use ($search) {
                            $cq->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($dateFrom, fn($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,   fn($q) => $q->whereDate('created_at', '<=', $dateTo));

        // --- Apply rating filter with modes ---
        if ($ratingMode === 'eq') {
            if ($rating !== null && $rating !== '') {
                $query->where('rating', (int) $rating);
            }
        } elseif ($ratingMode === 'range') {
            if ($minRating !== null && $minRating !== '' && $maxRating !== null && $maxRating !== '') {
                $query->whereBetween('rating', [(int) $minRating, (int) $maxRating]);
            }
        } else {
            // 'gte' (or unspecified -> legacy behavior)
            $min = ($minRating !== null && $minRating !== '') ? (int) $minRating : null;
            if ($min !== null && $min > 0) {
                $query->where('rating', '>=', $min);
            }
        }

        // Sorting safety
        if (!in_array($sortBy, ['created_at', 'rating'])) {
            $sortBy = 'created_at';
        }

        $reviews = $query->orderBy($sortBy, $sortDirection)
            ->paginate(10)
            ->withQueryString();

        // === KPI: good vs low reviews ===
        $avgRating = round((float) Review::avg('rating'), 2);
        $total     = Review::count();
        $goodCount = Review::where('rating', '>=', 4)->count(); // 4–5 stars
        $lowCount  = Review::where('rating', '<=', 3)->count(); // 1–3 stars


        return Inertia::render('Reviews', [
            'reviews' => $reviews,
            'filters' => [
                'search'         => $search,
                'date_from'      => $dateFrom,
                'date_to'        => $dateTo,
                'rating_mode'    => $ratingMode,
                'rating'         => $rating,
                'min_rating'     => $minRating,
                'max_rating'     => $maxRating,
                'sort_by'        => $sortBy,
                'sort_direction' => $sortDirection,
            ],
            'totals' => [
                'avg_rating'      => $avgRating,
                'total'           => $total,
                'good'     => $goodCount,    // Baru: rating 4–5
                'low'   => $lowCount,  // Baru: rating 1–3
            ],
            'flash' => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ]);
    }

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
        ]);

        return response()->json(['message' => 'Review saved successfully'], 201);
    }
}
