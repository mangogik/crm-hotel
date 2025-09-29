<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'customer_id',
        'room_id',
        'checkin_at',
        'checkout_at',
        'status',
        'notes'
    ];

    protected $casts = [
        'checkin_at' => 'datetime',
        'checkout_at' => 'datetime'
    ];

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
}
