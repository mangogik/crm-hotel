<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Room;
use App\Models\Order;
use App\Models\Service;
use App\Models\Payment;
use App\Models\Customer;
use App\Models\BookingInteraction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        // === Date Range ===
        $range = $request->input('range', 'this_month');
        $now = Carbon::now();
        switch ($range) {
            case 'this_week':
                $start = $now->copy()->startOfWeek();
                $end   = $now->copy()->endOfDay();
                break;
            case 'last_30_days':
                $start = $now->copy()->subDays(29)->startOfDay();
                $end   = $now->copy()->endOfDay();
                break;
            case 'custom':
                $start = Carbon::parse($request->input('start_date'))->startOfDay();
                $end   = Carbon::parse($request->input('end_date'))->endOfDay();
                break;
            case 'this_month':
            default:
                $start = $now->copy()->startOfMonth();
                $end   = $now->copy()->endOfDay();
        }

        $periodDays = $start->diffInDays($end) + 1;
        $prevStart  = $start->copy()->subDays($periodDays);
        $prevEnd    = $start->copy()->subSecond();

        // === KPIs ===
        $today = Carbon::today();

        $activeGuests = Booking::where('status', 'checked_in')
            ->whereDate('checkin_at', '<=', $today)
            ->whereDate('checkout_at', '>', $today)
            ->count();

        $ordersCompleted = Order::where('status', 'paid')
            ->whereBetween('created_at', [$start, $end])
            ->count();

        $ordersCompletedPrev = Order::where('status', 'paid')
            ->whereBetween('created_at', [$prevStart, $prevEnd])
            ->count();

        // REVENUE — gunakan created_at (karena paid_at tidak ada)
        $totalRevenue = (float) Payment::where('status', 'paid')
            ->whereBetween('created_at', [$start, $end])
            ->sum('amount');

        $totalRevenuePrev = (float) Payment::where('status', 'paid')
            ->whereBetween('created_at', [$prevStart, $prevEnd])
            ->sum('amount');

        // Upcoming check-ins (7 hari)
        $upcomingCheckins = Booking::where('status', 'reserved')
            ->whereBetween('checkin_at', [Carbon::now(), Carbon::now()->addDays(7)->endOfDay()])
            ->count();

        $upcomingCheckinsPrev = Booking::where('status', 'reserved')
            ->whereBetween('checkin_at', [Carbon::now()->subDays(7)->startOfDay(), Carbon::now()])
            ->count();

        // Occupancy
        $totalRooms = Room::count();
        $daysInPeriod = max(1, $periodDays);
        $availableNights = $totalRooms * $daysInPeriod;

        $occupiedNights = (int) Booking::where('status', '!=', 'cancelled')
            ->where('checkin_at', '<', $end)
            ->where('checkout_at', '>', $start)
            ->selectRaw("
                COALESCE(SUM(
                    GREATEST(0, DATEDIFF(LEAST(?, checkout_at), GREATEST(?, checkin_at)))
                ), 0) as nights
            ", [$end->toDateTimeString(), $start->toDateTimeString()])
            ->value('nights');

        $occupancyRate = $availableNights > 0
            ? round(($occupiedNights / $availableNights) * 100)
            : 0;

        $availableNightsPrev = $totalRooms * max(1, $prevStart->diffInDays($prevEnd) + 1);
        $occupiedNightsPrev = (int) Booking::where('status', '!=', 'cancelled')
            ->where('checkin_at', '<', $prevEnd)
            ->where('checkout_at', '>', $prevStart)
            ->selectRaw("
                COALESCE(SUM(
                    GREATEST(0, DATEDIFF(LEAST(?, checkout_at), GREATEST(?, checkin_at)))
                ), 0) as nights
            ", [$prevEnd->toDateTimeString(), $prevStart->toDateTimeString()])
            ->value('nights');

        $occupancyRatePrev = $availableNightsPrev > 0
            ? round(($occupiedNightsPrev / $availableNightsPrev) * 100)
            : 0;

        $pct = function ($curr, $prev) {
            if ($prev == 0) return $curr > 0 ? 100 : 0;
            return round((($curr - $prev) / $prev) * 100, 1);
        };

        // === Revenue Timeline (per hari) — pakai created_at ===
        $paymentsPerDay = Payment::where('status', 'paid')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as d, SUM(amount) as total')
            ->groupBy('d')
            ->orderBy('d')
            ->pluck('total', 'd')
            ->toArray();

        $revenueChartData = [];
        for ($cursor = $start->copy(); $cursor->lte($end); $cursor->addDay()) {
            $d = $cursor->toDateString();
            $revenueChartData[] = [
                'date' => $d,
                'revenue' => (float)($paymentsPerDay[$d] ?? 0),
            ];
        }

        // === Revenue by Source & Service Performance (order paid; created_at order) ===
        $revenueBySource = DB::table('order_service as os')
            ->join('services as s', 's.id', '=', 'os.service_id')
            ->join('orders as o', 'o.id', '=', 'os.order_id')
            ->where('o.status', 'paid')
            ->whereBetween('o.created_at', [$start, $end])
            ->select('s.type', DB::raw('COALESCE(SUM(os.quantity * s.price),0) as value'))
            ->groupBy('s.type')
            ->get()
            ->map(fn($r) => ['name' => $r->type ?? 'unknown', 'value' => (float)$r->value])
            ->values();

        $servicePerformance = DB::table('order_service as os')
            ->join('services as s', 's.id', '=', 'os.service_id')
            ->join('orders as o', 'o.id', '=', 'os.order_id')
            ->where('o.status', 'paid')
            ->whereBetween('o.created_at', [$start, $end])
            ->select('s.name', DB::raw('COALESCE(SUM(os.quantity * s.price),0) as revenue'))
            ->groupBy('s.id', 's.name')
            ->orderByDesc('revenue')
            ->limit(12)
            ->get()
            ->map(fn($r) => ['name' => $r->name, 'revenue' => (float)$r->revenue])
            ->values();

        // === Guest Demographics ===
        $guestDemographics = Customer::query()
            ->select('customers.passport_country', DB::raw('COUNT(*) as count'))
            ->join('bookings', 'bookings.customer_id', '=', 'customers.id')
            ->whereBetween('bookings.checkin_at', [$start, $end])
            ->groupBy('customers.passport_country')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // === Booking Details (estimasi total) ===
        $serviceTotalsByBooking = DB::table('orders as o')
            ->join('order_service as os', 'os.order_id', '=', 'o.id')
            ->join('services as s', 's.id', '=', 'os.service_id')
            ->select('o.booking_id', DB::raw('COALESCE(SUM(os.quantity * s.price),0) as service_total'))
            ->where('o.status', 'paid')
            ->groupBy('o.booking_id');

        // ===================================================================
        // 👇👇👇 PERUBAHAN DI SINI 👇👇👇
        // ===================================================================
        $bookingDetails = Booking::query()
            ->select([
                'bookings.id',
                'customers.name as guest',
                'rooms.room_number as room',
                'bookings.checkin_at as checkin',
                'bookings.checkout_at as checkout',
                'bookings.status',
                DB::raw('DATEDIFF(bookings.checkout_at, bookings.checkin_at) as nights'),
                'room_types.price_per_night', // <-- DIGANTI dari rooms.price_per_night
                DB::raw('COALESCE(st.service_total,0) as service_total'),
                DB::raw('(DATEDIFF(bookings.checkout_at, bookings.checkin_at) * room_types.price_per_night) + COALESCE(st.service_total,0) as total') // <-- DIGANTI dari rooms.price_per_night
            ])
            ->leftJoin('customers', 'customers.id', '=', 'bookings.customer_id')
            ->leftJoin('rooms', 'rooms.id', '=', 'bookings.room_id')
            ->leftJoin('room_types', 'room_types.id', '=', 'rooms.room_type_id') // <-- JOIN INI DITAMBAHKAN
            ->leftJoinSub($serviceTotalsByBooking, 'st', function ($join) {
                $join->on('st.booking_id', '=', 'bookings.id');
            })
            ->whereBetween('bookings.created_at', [$start, $end])
            ->orderByDesc('bookings.created_at')
            ->limit(12)
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id,
                    'guest' => $b->guest ?? '—',
                    'room' => $b->room ?? '—',
                    'checkin' => $b->checkin,
                    'checkout' => $b->checkout,
                    'status' => $b->status,
                    'nights' => (int)$b->nights,
                    'total' => (float)$b->total,
                ];
            });
        // ===================================================================
        // 👆👆👆 AKHIR PERUBAHAN 👆👆👆
        // ===================================================================


        // === Recent Activity ===
        $recentActivity = BookingInteraction::query()
            ->select('booking_interactions.*', 'customers.name as customer_name')
            ->leftJoin('bookings', 'bookings.id', '=', 'booking_interactions.booking_id')
            ->leftJoin('customers', 'customers.id', '=', 'bookings.customer_id')
            ->whereBetween('booking_interactions.created_at', [$start, $end])
            ->orderByDesc('booking_interactions.created_at')
            ->limit(8)
            ->get()
            ->map(function ($i) {
                return [
                    'id' => $i->id,
                    'type' => $i->type,
                    'customer' => $i->customer_name ?? 'Guest',
                    'context' => $i->details ?? null,
                    'at' => $i->created_at,
                ];
            });

        // === Top Guests by spend (pakai payments.created_at) ===
        $topGuests = DB::table('payments as p')
            ->join('orders as o', 'o.id', '=', 'p.order_id')
            ->join('customers as c', 'c.id', '=', 'o.customer_id')
            ->where('p.status', 'paid')
            ->whereBetween('p.created_at', [$start, $end])
            ->select('c.id', 'c.name', DB::raw('SUM(p.amount) as total_spend'))
            ->groupBy('c.id', 'c.name')
            ->orderByDesc('total_spend')
            ->limit(8)
            ->get()
            ->map(fn($r) => ['id' => $r->id, 'name' => $r->name, 'total' => (float)$r->total_spend]);

        $stats = [
            'revenue' => [
                'current' => $totalRevenue,
                'prev'    => $totalRevenuePrev,
                'change'  => $pct($totalRevenue, $totalRevenuePrev),
            ],
            'ordersCompleted' => [
                'current' => $ordersCompleted,
                'prev'    => $ordersCompletedPrev,
                'change'  => $pct($ordersCompleted, $ordersCompletedPrev),
            ],
            'occupancy' => [
                'current' => $occupancyRate,
                'prev'    => $occupancyRatePrev,
                'change'  => $pct($occupancyRate, $occupancyRatePrev),
            ],
            'upcomingCheckins' => [
                'current' => $upcomingCheckins,
                'prev'    => $upcomingCheckinsPrev,
                'change'  => $pct($upcomingCheckins, $upcomingCheckinsPrev),
            ],
            'activeGuests' => $activeGuests,
        ];

            // --- DEBUGGING: Log hasil query sebelum dikirim ke frontend ---
        Log::info('Report Data for Period: ' . $start->toDateString() . ' to ' . $end->toDateString());
        Log::info('Total Revenue: ' . $totalRevenue);
        Log::info('Booking Details Count: ' . $bookingDetails->count());
        Log::info('Recent Activity Count: ' . $recentActivity->count());
        Log::info('Top Guests Count: ' . $topGuests->count());

        return Inertia::render('Reports', [
            'filters' => [
                'range'      => $range,
                'start_date' => $range === 'custom' ? $start->toDateString() : null,
                'end_date'   => $range === 'custom' ? $end->toDateString() : null,
            ],
            'period' => [
                'start' => $start->toDateString(),
                'end'   => $end->toDateString(),
            ],
            'stats' => $stats,
            'revenueChartData' => $revenueChartData,
            'revenueBySource'  => $revenueBySource,
            'servicePerformance' => $servicePerformance,
            'guestDemographics'  => $guestDemographics,
            'bookingDetails'   => $bookingDetails,
            'recentActivity'   => $recentActivity,
            'topGuests'        => $topGuests,
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $start = Carbon::parse($request->input('start', Carbon::now()->startOfMonth()));
        $end   = Carbon::parse($request->input('end', Carbon::now()));

        $rows = Booking::with(['customer', 'room'])
            ->whereBetween('created_at', [$start, $end])
            ->orderByDesc('created_at')
            ->get();

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="hotel_reports_export.csv"',
        ];

        return response()->stream(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Booking ID', 'Guest', 'Room', 'Check-in', 'Check-out', 'Status']);
            foreach ($rows as $r) {
                fputcsv($out, [
                    $r->id,
                    optional($r->customer)->name,
                    optional($r->room)->room_number,
                    $r->checkin_at,
                    $r->checkout_at,
                    $r->status,
                ]);
            }
            fclose($out);
        }, 200, $headers);
    }
}