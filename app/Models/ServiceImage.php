<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceImage extends Model
{
    protected $fillable = [
        'service_id',
        'image_path',
        'caption',
    ];

    protected $appends = ['url'];

    public function getUrlAttribute()
    {
        // Pastikan image_path di DB itu RELATIF, contoh: "services/abc.jpg"
        // Hasil dari ini jadi: http://localhost:8000/storage/services/abc.jpg
        return asset('storage/' . ltrim($this->image_path, '/'));
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}
