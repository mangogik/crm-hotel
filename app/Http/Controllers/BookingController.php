<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Service;
use App\Services\RoomStatusService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $query = Booking::with([
            'customer',
            'room.roomType',   // pastikan roomType ikut dimuat
            'interactions'
        ]);

        // Search: by customer name atau room number
        $query->when($request->input('search'), function ($q, $search) {
            $q->whereHas('customer', function ($subQ) use ($search) {
                $subQ->where('name', 'like', "%{$search}%");
            })->orWhereHas('room', function ($subQ) use ($search) {
                $subQ->where('room_number', 'like', "%{$search}%");
            });
        });

        // Filter status
        $query->when($request->input('status'), function ($q, $status) {
            $q->where('status', $status);
        });

        // Filter date range
        $query->when($request->input('checkin_from'), function ($q, $date) {
            $q->whereDate('checkin_at', '>=', $date);
        });
        $query->when($request->input('checkin_to'), function ($q, $date) {
            $q->whereDate('checkin_at', '<=', $date);
        });

        $sortBy        = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        // Sorting by related columns (customer_name / room_number)
        if (in_array($sortBy, ['customer_name', 'room_number'])) {
            $relatedTable  = $sortBy === 'customer_name' ? 'customers' : 'rooms';
            $relatedColumn = $sortBy === 'customer_name' ? 'name' : 'room_number';

            $query->orderBy(
                ($relatedTable === 'customers'
                    ? Customer::select($relatedColumn)->whereColumn('customers.id', 'bookings.customer_id')
                    : Room::select($relatedColumn)->whereColumn('rooms.id', 'bookings.room_id')),
                $sortDirection
            );
        } else {
            $query->orderBy($sortBy, $sortDirection);
        }

        $bookings = $query->paginate(10)->withQueryString();

        // Ambil semua service yg dipakai di interactions untuk map id->name
        $serviceIds = $bookings->getCollection()
            ->flatMap(fn($booking) => $booking->interactions)
            ->pluck('metadata.service_id')
            ->filter()
            ->unique();

        $servicesMap = Service::whereIn('id', $serviceIds)->pluck('name', 'id');

        // Transform payload untuk FE
        $bookings->getCollection()->transform(function ($booking) use ($servicesMap) {
            // pastikan roomType sudah ada agar accessor room_label aman
            $booking->loadMissing('room.roomType');

            return [
                'id'          => $booking->id,
                'customer_id' => $booking->customer_id,
                'room_id'     => $booking->room_id,
                'checkin_at'  => $booking->checkin_at->toIso8601String(),
                'checkout_at' => $booking->checkout_at->toIso8601String(),
                'status'      => $booking->status,
                'source'      => $booking->source,
                'notes'       => $booking->notes,
                'created_at'  => $booking->created_at->toIso8601String(),

                // Relasi
                'customer'    => $booking->customer,
                'room'        => $booking->room, // room berisi roomType juga

                // Accessor
                'room_label'  => $booking->room_label,

                'interactions' => $booking->interactions
                    ->map(function ($interaction) use ($servicesMap) {
                        $serviceId   = $interaction->metadata['service_id'] ?? null;
                        $optionName  = $interaction->metadata['value'] ?? null;
                        $serviceName = $servicesMap[$serviceId] ?? $interaction->details;

                        $finalDetail = $serviceName;

                        if ($optionName && $optionName !== $serviceName) {
                            $finalDetail = "{$serviceName} ({$optionName})";
                        }

                        if ($interaction->interaction_type === 'view_services') {
                            $finalDetail = '-';
                        } elseif ($interaction->interaction_type === 'payment' && isset($interaction->metadata['method'])) {
                            $finalDetail = ucfirst($interaction->metadata['method']);
                        }

                        return [
                            'id'               => $interaction->id,
                            'interaction_type' => $interaction->interaction_type,
                            'details'          => $finalDetail,
                            'metadata'         => $interaction->metadata,
                            'created_at'       => $interaction->created_at->toIso8601String(),
                        ];
                    })
                    ->sortByDesc('created_at')
                    ->values(),
            ];
        });

        // Dropdown Customers & Rooms untuk form Booking (rooms ikut name type)
        $customersList = Customer::orderBy('name')->get(['id', 'name', 'phone', 'passport_country']);

        // Rooms sekarang tidak punya kolom room_type; ikutkan relation agar FE bisa render label
        $roomsList = Room::with('roomType:id,name')
            ->orderBy('room_number')
            ->get(['id', 'room_number', 'room_type_id', 'status']);

        return Inertia::render('Bookings', [
            'bookings'  => $bookings,
            'filters'   => $request->only([
                'search',
                'status',
                'checkin_from',
                'checkin_to',
                'sort_by',
                'sort_direction',
            ]),
            'customers' => $customersList,
            'rooms'     => $roomsList,
            'flash'     => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ]);
    }

    public function store(Request $request, RoomStatusService $roomSvc)
    {
        Log::debug('[Booking.store] incoming payload (raw)', $request->all());

        try {
            $data = $request->validate([
                'customer_id' => 'required|exists:customers,id',
                'room_id'     => 'required|exists:rooms,id',
                'checkin_at'  => 'required|date',
                'checkout_at' => 'required|date|after_or_equal:checkin_at',
                'status'      => 'nullable|string',
                'notes'       => 'nullable|string',
                'source'      => ['nullable', Rule::in(['direct', 'ota', 'agent'])],
            ]);
            Log::debug('[Booking.store] validated data', $data);
        } catch (\Throwable $e) {
            Log::error('[Booking.store] validation failed', [
                'errors' => $e instanceof \Illuminate\Validation\ValidationException ? $e->errors() : $e->getMessage(),
            ]);
            throw $e;
        }

        // default-kan source
        $data['source'] = $data['source'] ?? 'direct';

        // Derive status dari checkin_at
        $checkin = Carbon::parse($data['checkin_at']);
        if ($checkin->isFuture()) {
            $data['status'] = 'reserved';
        } elseif ($checkin->isToday()) {
            $candidate      = $request->input('status');
            $data['status'] = in_array($candidate, ['reserved', 'checked_in']) ? $candidate : 'reserved';
        } else {
            $data['status'] = $request->input('status', 'reserved');
        }

        Log::debug('[Booking.store] final status/source after derive', [
            'status' => $data['status'],
            'source' => $data['source'],
        ]);

        // Cek overlap
        $existingBooking = Booking::where('room_id', $data['room_id'])
            ->where(function ($query) use ($data) {
                $query->where('checkin_at', '<', $data['checkout_at'])
                    ->where('checkout_at', '>', $data['checkin_at']);
            })
            ->whereIn('status', ['reserved', 'checked_in'])
            ->exists();

        if ($existingBooking) {
            Log::warning('[Booking.store] conflict: room already booked', [
                'room_id'     => $data['room_id'],
                'checkin_at'  => $data['checkin_at'],
                'checkout_at' => $data['checkout_at'],
            ]);
            return Redirect::back()->with('error', 'Room is already booked for the selected dates.');
        }

        try {
            $booking = Booking::create($data);
            Log::debug('[Booking.store] booking created', [
                'booking_id' => $booking->id,
                'source'     => $booking->source,
            ]);

            $customer = Customer::find($booking->customer_id);

            // Recompute room status
            $roomSvc->recompute($data['room_id']);

            // --- Kirim webhook (kirim room_number & room_type_name sekalian) ---
            try {
                $booking->loadMissing('room.roomType');

                Http::post('http://localhost:8088/webhook-test/booking-created', [
                    'id'                 => $customer->id,
                    'booking_id'         => $booking->id,
                    'access_token'       => $booking->access_token, // <-- TAMBAHKAN INI
                    'name'               => $customer->name,
                    'email'              => $customer->email,
                    'phone'              => $customer->phone,
                    'passport_country'   => $customer->passport_country,
                    'room_id'            => $booking->room_id,
                    'room_number'        => optional($booking->room)->room_number,
                    'room_type_name'     => optional($booking->room?->roomType)->name,
                    'room_label'         => $booking->room_label,
                    'checkin_at'         => $booking->checkin_at,
                    'checkout_at'        => $booking->checkout_at,
                    'notes'              => $booking->notes,
                    'source'             => $booking->source,
                    'preferred_language' => $customer->preferred_language,
                ]);

                Log::debug('[Booking.store] webhook sent');
            } catch (\Throwable $e) {
                Log::error('[Booking.store] webhook failed', ['error' => $e->getMessage()]);
            }

            return Redirect::route('bookings.index')->with('success', 'Booking created successfully.');
        } catch (\Throwable $e) {
            Log::error('[Booking.store] create failed', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            return Redirect::back()->with('error', 'Failed to create booking.');
        }
    }

    public function update(Request $request, Booking $booking, RoomStatusService $roomSvc)
    {
        $data = $request->validate([
            'customer_id'             => 'required|exists:customers,id',
            'room_id'                 => 'required|exists:rooms,id',
            'checkin_at'              => 'required|date',
            'checkout_at'             => 'required|date|after_or_equal:checkin_at',
            'status'                  => ['required', Rule::in(['reserved', 'checked_in', 'checked_out', 'cancelled'])],
            'notes'                   => 'nullable|string',
            'override_future_checkin' => 'sometimes|boolean',
        ]);

        $checkinAt       = Carbon::parse($data['checkin_at']);
        $isFutureCheckin = $checkinAt->isAfter(now()) && !$checkinAt->isSameDay(now());
        $wantsCheckedIn  = $data['status'] === 'checked_in';

        if ($wantsCheckedIn && $isFutureCheckin && !$request->boolean('override_future_checkin')) {
            return back()->withErrors([
                'status' => 'This booking’s check-in time is in the future. Confirm the override if you really want to set it to Checked In.',
            ])->withInput();
        }
        if ($wantsCheckedIn && $isFutureCheckin && $request->boolean('override_future_checkin')) {
            Log::warning('[Booking.update] Override future check-in accepted', [
                'booking_id' => $booking->id,
                'checkin_at' => $data['checkin_at'],
                'user_id'    => optional($request->user())->id,
            ]);
        }

        $originalStatus = $booking->getOriginal('status');
        $originalRoomId = (int) $booking->room_id;

        $roomChanged = (int) $data['room_id'] !== $originalRoomId;

        DB::transaction(function () use ($booking, $data, $originalStatus) {
            $booking->update($data);

            // total_visits rules
            if ($originalStatus !== 'checked_out' && $data['status'] === 'checked_out') {
                DB::table('customers')->where('id', $data['customer_id'])
                    ->update(['total_visits' => DB::raw('total_visits + 1')]);
            }
            if ($originalStatus === 'checked_out' && in_array($data['status'], ['reserved', 'checked_in'])) {
                DB::table('customers')->where('id', $data['customer_id'])
                    ->update(['total_visits' => DB::raw('GREATEST(total_visits - 1, 0)')]);
            }
        });

        // Refresh & flags
        $booking->refresh();
        $statusChanged = $booking->wasChanged('status');
        $datesChanged  = $booking->wasChanged(['checkin_at', 'checkout_at']);

        Log::info('[Booking.update] post-commit change flags', [
            'booking_id'    => $booking->id,
            'roomChanged'   => $roomChanged,
            'statusChanged' => $statusChanged,
            'datesChanged'  => $datesChanged,
            'new_status'    => $booking->status,
            'room_id'       => (int) $booking->room_id,
        ]);

        if ($roomChanged) {
            $roomSvc->recompute($originalRoomId);
        }
        if ($roomChanged || $statusChanged || $datesChanged) {
            $roomSvc->recompute((int) $booking->room_id);
        }

        return Redirect::route('bookings.index')->with('success', 'Booking updated successfully.');
    }

    public function destroy(Booking $booking, RoomStatusService $roomSvc)
    {
        $roomId = $booking->room_id;
        $booking->delete();
        $roomSvc->recompute($roomId);

        return Redirect::route('bookings.index')->with('success', 'Booking deleted successfully.');
    }

    public function checkAvailability(Request $request)
    {
        try {
            $validated = $request->validate([
                'checkin_date'  => 'required|date|after_or_equal:today',
                'checkout_date' => 'required|date|after:checkin_date',
                'room_type'     => 'nullable|string',   // nama tipe (opsional)
                'min_price'     => 'nullable|numeric|min:0',
                'max_price'     => 'nullable|numeric|min:0',
                'capacity'      => 'nullable|integer|min:1',
            ]);

            $checkin  = Carbon::parse($validated['checkin_date']);
            $checkout = Carbon::parse($validated['checkout_date']);

            $bookedRoomIds = Booking::where(function ($query) use ($checkin, $checkout) {
                $query->where('checkin_at', '<', $checkout)
                    ->where('checkout_at', '>', $checkin);
            })
                ->whereIn('status', ['reserved', 'checked_in'])
                ->pluck('room_id');

            // Gabungkan rooms + room_types untuk filter berdasar tipe/price/capacity
            $query = Room::query()
                ->leftJoin('room_types', 'room_types.id', '=', 'rooms.room_type_id')
                ->whereNotIn('rooms.id', $bookedRoomIds)
                ->select([
                    'rooms.id',
                    'rooms.room_number',
                    'rooms.status',
                    'rooms.room_type_id',
                    'room_types.name as type_name',
                    'room_types.capacity as type_capacity',
                    'room_types.price_per_night as type_price',
                ]);

            if ($request->filled('room_type')) {
                $query->where('room_types.name', $request->room_type);
            }
            if ($request->filled('min_price')) {
                $query->where('room_types.price_per_night', '>=', $request->min_price);
            }
            if ($request->filled('max_price')) {
                $query->where('room_types.price_per_night', '<=', $request->max_price);
            }
            if ($request->filled('capacity')) {
                $query->where('room_types.capacity', '>=', $request->capacity);
            }

            $rows   = $query->get();
            $nights = $checkin->diffInDays($checkout);

            $transformedRooms = $rows->map(function ($row) use ($nights) {
                $price = (float) ($row->type_price ?? 0);
                return [
                    'id'              => $row->id,
                    'room_number'     => $row->room_number,
                    'room_type'       => $row->type_name,        // tampilkan nama tipe (bukan kolom lama)
                    'capacity'        => (int) $row->type_capacity,
                    'price_per_night' => $price,
                    'total_price'     => $price * $nights,
                    'nights'          => $nights,
                ];
            });

            return response()->json(['rooms' => $transformedRooms]);
        } catch (\Exception $e) {
            Log::error('Availability check error: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function byCustomer(\App\Models\Customer $customer, \Illuminate\Http\Request $req)
    {
        $onlyActive = (bool) $req->boolean('onlyActive', true);

        $q = $customer->bookings()
            ->select('id', 'room_id', 'status', 'checkin_at', 'checkout_at')
            ->with([
                'room:id,room_number,room_type_id',  // kolom relasi baru
                'room.roomType:id,name'              // ikutkan nama tipe
            ]);

        if ($onlyActive) {
            $q->whereIn('status', ['reserved', 'checked_in']);
        }

        $rows = $q->orderByDesc('checkin_at')->get();

        $payload = $rows->map(function ($b) {
            $label = $b->room_label; // accessor aman

            return [
                'id'          => $b->id,
                'status'      => $b->status,
                'room_label'  => $label,
                'room_number' => $b->room->room_number ?? null,
                'room_type'   => $b->room?->roomType?->name, // info tambahan jika mau dipakai FE
                'checkin_at'  => $b->checkin_at,
                'checkout_at' => $b->checkout_at,
            ];
        });

        return response()->json(['bookings' => $payload]);
    }

    public function getActiveBookingByPhone($phone)
    {
        $bookings = Booking::with(['customer', 'room.roomType'])
            ->whereHas('customer', function ($query) use ($phone) {
                $query->where('phone', $phone);
            })
            ->whereIn('status', ['reserved', 'checked_in'])
            ->orderBy('checkin_at', 'asc')
            ->get();

        if ($bookings->isEmpty()) {
            return response()->json(['message' => 'No active bookings found for this phone number.'], 404);
        }

        $payload = $bookings->map(function ($booking) {
            return [
                'id'                 => $booking->customer->id,
                'booking_id'         => $booking->id,
                'name'               => $booking->customer->name,
                'email'              => $booking->customer->email,
                'phone'              => $booking->customer->phone,
                'preferred_language' => $booking->customer->preferred_language,
                'room_label'         => $booking->room_label,
                'checkin_at'         => $booking->checkin_at->toIso8601String(),
                'checkout_at'        => $booking->checkout_at->toIso8601String(),
            ];
        });

        return response()->json($payload);
    }
}
