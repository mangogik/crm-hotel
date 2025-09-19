<?php

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
        'unit_name',
        'options'
    ];

    protected $casts = [
        'options' => 'array',
    ];

    public function orders()
    {
        return $this->belongsToMany(Order::class)->withPivot('quantity', 'price_per_unit', 'details')->withTimestamps();
    }
}
