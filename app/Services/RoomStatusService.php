<?php

namespace App\Services;

use App\Models\Room;
use App\Models\Booking;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class RoomStatusService
{
    /**
     * Atur status kamar berdasarkan booking "aktif saat ini".
     * - Jika room.status == maintenance => tidak diubah (log & return)
     * - occupied: jika ADA booking checked_in (atau reserved, jika kamu mau) yang overlap dengan "now"
     * - else available
     */
    public function recompute(int $roomId): void
    {
        $room = Room::find($roomId);
        if (!$room) return;

        $now   = \Carbon\Carbon::now();
        $today = $now->toDateString();

        if ($room->status === 'maintenance') return;

        $hasActiveNow = \App\Models\Booking::where('room_id', $roomId)
            ->where('status', 'checked_in')
            ->where(function ($q) use ($now, $today) {
                // (1) strict time window covers “right now”
                $q->where(function ($qq) use ($now) {
                    $qq->where('checkin_at', '<=', $now)
                        ->where('checkout_at', '>', $now);
                })
                    // OR (2) same-day check-in counts as occupied even if time is later today
                    ->orWhereDate('checkin_at', $today);
            })
            ->exists();

        $newStatus = $hasActiveNow ? 'occupied' : 'available';
        if ($room->status !== $newStatus) {
            $room->update(['status' => $newStatus]);
        }
    }
}
