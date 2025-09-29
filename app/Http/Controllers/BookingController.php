<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Room;
use App\Models\Service;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log; // Kita tetap pakai Log untuk keamanan

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $query = Booking::with(['customer', 'room', 'interactions']);

        // --- Blok filtering dan sorting Anda (tidak ada perubahan) ---
        $query->when($request->input('search'), function ($q, $search) {
            $q->whereHas('customer', function ($subQ) use ($search) {
                $subQ->where('name', 'like', "%{$search}%");
            })->orWhereHas('room', function ($subQ) use ($search) {
                $subQ->where('room_number', 'like', "%{$search}%");
            });
        });
        $query->when($request->input('status'), function ($q, $status) {
            $q->where('status', $status);
        });
        $query->when($request->input('checkin_from'), function ($q, $date) {
            $q->whereDate('checkin_at', '>=', $date);
        });
        $query->when($request->input('checkin_to'), function ($q, $date) {
            $q->whereDate('checkin_at', '<=', $date);
        });
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        if (in_array($sortBy, ['customer_name', 'room_number'])) {
            $relatedTable = $sortBy === 'customer_name' ? 'customers' : 'rooms';
            $relatedColumn = $sortBy === 'customer_name' ? 'name' : 'room_number';
            $query->orderBy(
                ($relatedTable === 'customers' ? Customer::select($relatedColumn)
                    ->whereColumn('customers.id', 'bookings.customer_id') :
                    Room::select($relatedColumn)
                    ->whereColumn('rooms.id', 'bookings.room_id')),
                $sortDirection
            );
        } else {
            $query->orderBy($sortBy, $sortDirection);
        }
        // --- Akhir dari blok filtering dan sorting ---

        $bookings = $query->paginate(10)->withQueryString();

        $serviceIds = $bookings->getCollection()
            ->flatMap(fn($booking) => $booking->interactions)
            ->pluck('metadata.service_id')
            ->filter()
            ->unique();

        $servicesMap = Service::whereIn('id', $serviceIds)->pluck('name', 'id');

        $bookings->getCollection()->transform(function ($booking) use ($servicesMap) {
            return [
                'id' => $booking->id,
                'customer_id' => $booking->customer_id,
                'room_id' => $booking->room_id,
                'checkin_at' => $booking->checkin_at->toIso8601String(),
                'checkout_at' => $booking->checkout_at->toIso8601String(),
                'status' => $booking->status,
                'notes' => $booking->notes,
                'created_at' => $booking->created_at->toIso8601String(),
                'customer' => $booking->customer,
                'room' => $booking->room,
                'interactions' => $booking->interactions->map(function ($interaction) use ($servicesMap) {

                    // --- LOGIKA BARU YANG DIPERBAIKI ADA DI SINI ---

                    $serviceId = $interaction->metadata['service_id'] ?? null;
                    $optionName = $interaction->metadata['value'] ?? null;
                    $serviceName = $servicesMap[$serviceId] ?? $interaction->details; // Fallback ke details jika nama tidak ditemukan

                    $finalDetail = $serviceName; // Defaultnya adalah nama layanan

                    // Cek jika ada nama opsi DAN nama itu BERBEDA dari nama layanan utama
                    if ($optionName && $optionName !== $serviceName) {
                        $finalDetail = "{$serviceName} ({$optionName})";
                    }

                    // Pengecualian khusus untuk tipe interaksi tertentu
                    if ($interaction->interaction_type === 'view_services') {
                        $finalDetail = '-';
                    } else if ($interaction->interaction_type === 'payment' && isset($interaction->metadata['method'])) {
                        $finalDetail = ucfirst($interaction->metadata['method']);
                    }

                    return [
                        'id' => $interaction->id,
                        'interaction_type' => $interaction->interaction_type,
                        'details' => $finalDetail,
                        'metadata' => $interaction->metadata,
                        'created_at' => $interaction->created_at->toIso8601String(),
                    ];
                })->sortByDesc('created_at')->values(),
            ];
        });

        return Inertia::render('Bookings', [
            'bookings' => $bookings,
            'filters' => $request->only(['search', 'status', 'checkin_from', 'checkin_to', 'sort_by', 'sort_direction']),
            'customers' => Customer::orderBy('name')->get(['id', 'name', 'phone', 'passport_country']),
            'rooms' => Room::orderBy('room_number')->get(['id', 'room_number', 'room_type', 'status']),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        // Log data yang masuk SEBELUM validasi untuk memastikan data sampai
        Log::info('Incoming data for new booking:', $request->all());

        $data = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'room_id' => 'required|exists:rooms,id',
            'checkin_at' => 'required|date',
            'checkout_at' => 'required|date|after_or_equal:checkin_at',
            'status' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $existingBooking = Booking::where('room_id', $data['room_id'])
            ->where(function ($query) use ($data) {
                $query->where('checkin_at', '<', $data['checkout_at'])
                    ->where('checkout_at', '>', $data['checkin_at']);
            })
            ->whereIn('status', ['reserved', 'checked_in'])
            ->exists();

        if ($existingBooking) {
            return Redirect::back()->with('error', 'Room is already booked for the selected dates.');
        }

        $booking = Booking::create($data);
        $customer = Customer::find($booking->customer_id);

        $room = Room::find($data['room_id']);
        if ($room) {
            $room->status = 'occupied';
            $room->save();
        }

        // Kirim webhook ke n8n
        try {
            Http::post('https://otomations.kumtura.me/webhook-test/booking-created', [
                'id' => $customer->id,
                'booking_id' => $booking->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'passport_country' => $customer->passport_country,
                'checkin_at' => $booking->checkin_at,
                'checkout_at' => $booking->checkout_at,
                'notes' => $booking->notes,
            ]);
        } catch (\Exception $e) {
            Log::error('Gagal kirim webhook booking-created', ['error' => $e->getMessage()]);
        }

        return Redirect::route('bookings.index')->with('success', 'Booking created successfully.');
    }

    public function update(Request $request, Booking $booking)
    {
        $data = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'room_id' => 'required|exists:rooms,id',
            'checkin_at' => 'required|date',
            'checkout_at' => 'required|date|after_or_equal:checkin_at',
            'status' => ['required', Rule::in(['reserved', 'checked_in', 'checked_out', 'cancelled'])],
            'notes' => 'nullable|string',
        ]);

        $originalStatus = $booking->getOriginal('status');
        $originalRoomId = $booking->room_id;

        $booking->update($data);

        if ($originalStatus === 'reserved' && $data['status'] === 'checked_in') {
            $customer = Customer::find($data['customer_id']);
            $customer->incrementVisits($data['checkin_at']);
        }

        if ($originalRoomId != $data['room_id']) {
            Room::find($originalRoomId)->update(['status' => 'available']);
        }

        $currentRoom = Room::find($data['room_id']);
        if ($data['status'] === 'checked_out' || $data['status'] === 'cancelled') {
            $currentRoom->status = 'available';
        } else {
            $currentRoom->status = 'occupied';
        }
        $currentRoom->save();

        return Redirect::route('bookings.index')->with('success', 'Booking updated successfully.');
    }

    public function destroy(Booking $booking)
    {
        $booking->room()->update(['status' => 'available']);
        $booking->delete();

        return Redirect::route('bookings.index')->with('success', 'Booking deleted successfully.');
    }

    public function checkAvailability(Request $request)
    {
        try {
            $validated = $request->validate([
                'checkin_date' => 'required|date|after_or_equal:today',
                'checkout_date' => 'required|date|after:checkin_date',
                'room_type' => 'nullable|string',
                'min_price' => 'nullable|numeric|min:0',
                'max_price' => 'nullable|numeric|min:0',
                'capacity' => 'nullable|integer|min:1',
            ]);

            $checkin = Carbon::parse($validated['checkin_date']);
            $checkout = Carbon::parse($validated['checkout_date']);

            $bookedRoomIds = Booking::where(function ($query) use ($checkin, $checkout) {
                $query->where('checkin_at', '<', $checkout)
                    ->where('checkout_at', '>', $checkin);
            })
                ->whereIn('status', ['reserved', 'checked_in'])
                ->pluck('room_id');

            $query = Room::whereNotIn('id', $bookedRoomIds);

            if ($request->filled('room_type')) {
                $query->where('room_type', $request->room_type);
            }
            if ($request->filled('min_price')) {
                $query->where('price_per_night', '>=', $request->min_price);
            }
            if ($request->filled('max_price')) {
                $query->where('price_per_night', '<=', $request->max_price);
            }
            if ($request->filled('capacity')) {
                $query->where('capacity', '>=', $request->capacity);
            }

            $rooms = $query->get();
            $nights = $checkin->diffInDays($checkout);

            $transformedRooms = $rooms->map(function ($room) use ($nights) {
                return [
                    'id' => $room->id,
                    'room_number' => $room->room_number,
                    'room_type' => $room->room_type,
                    'capacity' => $room->capacity,
                    'price_per_night' => $room->price_per_night,
                    'total_price' => $room->price_per_night * $nights,
                    'nights' => $nights,
                ];
            });

            return response()->json(['rooms' => $transformedRooms]);
        } catch (\Exception $e) {
            Log::error('Availability check error: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }
}
