<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'type',
        'options',
        'unit_name',
        'fulfillment_type',
    ];

    // Casting for JSON columns
    protected $casts = [
        'options' => 'array',
        'price' => 'float',
    ];

    public function orders()
    {
        return $this->belongsToMany(Order::class)
            ->withPivot('quantity', 'price_per_unit', 'details')
            ->withTimestamps()
            ->withCasts([
                'price_per_unit' => 'float',
                'quantity' => 'integer',
            ]);
    }
}
