<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'checkin_at',
        'checkout_at',
        'notes'
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
