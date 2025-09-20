<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'passport_country',
        'checkin_at',
        'checkout_at',
        'notes'
    ];

    protected $casts = [
        'checkin_at'  => 'datetime',
        'checkout_at' => 'datetime',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
