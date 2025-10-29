<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceOptionImage extends Model
{
    protected $fillable = [
        'service_id',
        'option_key',
        'option_name',
        'image_path',
        'caption',
    ];

    protected $appends = ['url'];

    public function getUrlAttribute()
    {
        return asset('storage/' . ltrim($this->image_path, '/'));
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}
