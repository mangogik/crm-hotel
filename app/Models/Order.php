<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'customer_id',
        'status',
        'payment_method'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function services()
    {
        return $this->belongsToMany(Service::class)
            ->withPivot('quantity', 'price_per_unit', 'details')
            ->withTimestamps();
    }

    public function getTotalPriceAttribute(): float
    {
        return $this->services->sum(function ($service) {
            return $service->pivot->price_per_unit * $service->pivot->quantity;
        });
    }
}
