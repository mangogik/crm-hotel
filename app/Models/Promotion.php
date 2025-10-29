<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    protected $fillable = [
        'name',
        'type',                 // 'birthday' | 'event' | 'membership'
        'active',               // boolean 0/1
        'discount_percent',     // nullable
        'discount_amount',      // nullable
        'free_service_id',      // nullable
        'free_service_qty',     // default 1
        'birthday_days_before', // default 3
        'membership_tier',      // nullable
    ];

    protected $casts = [
        'active'               => 'boolean',
        'discount_percent'     => 'integer',
        'discount_amount'      => 'decimal:2',
        'free_service_id'      => 'integer',
        'free_service_qty'     => 'integer',
        'birthday_days_before' => 'integer',
        'created_at'           => 'datetime',
        'updated_at'           => 'datetime',
    ];

    /* Relationships */
    public function services()
    {
        return $this->belongsToMany(Service::class, 'promotion_services');
    }

    public function freeService()
    {
        return $this->belongsTo(Service::class, 'free_service_id');
    }

    public function usages()
    {
        return $this->hasMany(PromotionUsed::class, 'promotion_id');
    }

    /* Scopes */
    public function scopeActive($q)
    {
        return $q->where('active', true);
    }

    public function scopeType($q, string $type)
    {
        return $q->where('type', $type);
    }
}
