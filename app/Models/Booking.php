<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Booking extends Model
{
    protected $fillable = [
        'customer_id',
        'room_id',
        'checkin_at',
        'checkout_at',
        'status',
        'notes',
        'source',
    ];

    protected $casts = [
        'checkin_at'  => 'datetime',
        'checkout_at' => 'datetime',
    ];

    /**
     * Agar field virtual `room_label` ikut tampil di array/JSON.
     */
    protected $appends = ['room_label'];

    // -----------------
    // Relations
    // -----------------
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function interactions()
    {
        return $this->hasMany(BookingInteraction::class)->orderBy('created_at', 'desc');
    }

    public function reminders()
    {
        return $this->hasMany(Reminder::class, 'target_id')
            ->where('target_type', 'booking');
    }

    // -----------------
    // Accessors
    // -----------------

    /**
     * Accessor ringkas untuk label kamar, otomatis load relasi 'room'
     * jika belum tersedia.
     *
     * Contoh output: "Room 101 (Standard)"
     */
    public function getRoomLabelAttribute(): ?string
    {
        // Pastikan relasi room tersedia (di-load hanya jika belum)
        if (!$this->relationLoaded('room') && $this->room_id) {
            $this->loadMissing('room:id,room_number,room_type');
        }

        if (!$this->room) {
            return null;
        }

        $label = 'Room ' . $this->room->room_number;
        if (!empty($this->room->room_type)) {
            $label .= ' (' . $this->room->room_type . ')';
        }

        return $label;
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($booking) {
            if (empty($booking->access_token)) {
                $booking->access_token = Str::uuid()->toString();
            }
        });
    }

    protected static function booted(): void
    {
        static::creating(function ($booking) {
            // Jika access_token belum ada, buat yang baru.
            if (empty($booking->access_token)) {
                $booking->access_token = Str::uuid()->toString();
            }
        });
    }
}
