<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerInteraction extends Model
{
    protected $fillable = [
        'customer_id',
        'interaction_type',
        'channel',
        'content',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
