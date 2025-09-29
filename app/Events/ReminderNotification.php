<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast; // <-- 1. Pastikan ini di-import
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReminderNotification implements ShouldBroadcast // <-- 2. Tambahkan "implements ShouldBroadcast"
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Pesan notifikasi yang akan dikirim.
     *
     * @var string
     */
    public string $message;

    /**
     * Buat instance event baru.
     */
    public function __construct(string $message)
    {
        $this->message = $message;
    }

    /**
     * Tentukan channel tempat event ini akan disiarkan.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('staff-notifications'),
        ];
    }
}