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

        // --- Rating filters (new, with backward compatibility) ---
        $ratingMode = $request->input('rating_mode'); // 'eq' | 'gte' | 'range' | null
        $rating     = $request->input('rating');      // for 'eq'
        $minRating  = $request->input('min_rating');  // for 'gte' & 'range' (also legacy)
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
        // Default mode: keep your existing behavior (min_rating = gte) when rating_mode is not provided.
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

        // KPI totals (unchanged)
        $avgRating     = round((float) Review::avg('rating'), 2);
        $totalReviews  = (int) Review::count();
        $todayReviews  = (int) Review::whereDate('created_at', now()->toDateString())->count();
        $last7dReviews = (int) Review::whereBetween('created_at', [
            now()->copy()->subDays(6)->toDateString(),
            now()->toDateString(),
        ])->count();

        return Inertia::render('Reviews', [
            'reviews' => $reviews,
            'filters' => [
                'search'         => $search,
                'date_from'      => $dateFrom,
                'date_to'        => $dateTo,
                // expose new fields so UI can adopt later without breaking current page
                'rating_mode'    => $ratingMode,
                'rating'         => $rating,
                'min_rating'     => $minRating,
                'max_rating'     => $maxRating,
                'sort_by'        => $sortBy,
                'sort_direction' => $sortDirection,
            ],
            'totals' => [
                'avg_rating' => $avgRating,
                'total'      => $totalReviews,
                'today'      => $todayReviews,
                'last7d'     => $last7dReviews,
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
            // No review_date field - using created_at timestamp instead
        ]);

        return response()->json(['message' => 'Review saved successfully'], 201);
    }
}
