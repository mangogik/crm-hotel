<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'customer_id',
        'booking_id',
        'status',
        'payment_method'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function services()
    {
        return $this->belongsToMany(Service::class, 'order_service')
            ->withPivot(['quantity', 'price_per_unit', 'details'])
            ->withTimestamps();
    }

    public function reminders()
    {
        return $this->hasMany(Reminder::class, 'target_id')
            ->where('target_type', 'order');
    }

    public function getTotalPriceAttribute()
    {
        return $this->services->sum(function ($service) {
            return $service->pivot->price_per_unit * $service->pivot->quantity;
        });
    }
}
