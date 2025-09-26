<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reminder extends Model
{
    protected $fillable = [
        'reminder_type',
        'target_id',
        'target_type',
        'scheduled_at',
        'status',
        'sent_at'
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime'
    ];

    public function getTargetAttribute()
    {
        return $this->target_type === 'order' 
            ? Order::find($this->target_id)
            : Booking::find($this->target_id);
    }
}
