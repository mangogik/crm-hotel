<?php

// app/Models/Service.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'type',
        'fulfillment_type',
        'offering_session',
        'unit_name',
        'options',
        'membership_discount'
    ];

    protected $casts = [
        'options' => 'array',
        'membership_discount' => 'array'
    ];

    public function orders()
    {
        return $this->belongsToMany(Order::class, 'order_service')
            ->withPivot(['quantity', 'price_per_unit', 'details'])
            ->withTimestamps();
    }

    public function getDiscountForMembership($membershipType)
    {
        return $this->membership_discount[$membershipType] ?? 0;
    }

    public function promotions()
    {
        return $this->belongsToMany(Promotion::class, 'promotion_services');
    }
}
