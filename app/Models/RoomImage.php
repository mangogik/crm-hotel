<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomImage extends Model
{
    use HasFactory;

    protected $table = 'room_images';

    protected $fillable = [
        'room_id',
        'image_path',
        'caption',
    ];

    /**
     * Get the room that owns the image.
     */
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Get the full URL for the image.
     *
     * @return string
     */
    public function getUrlAttribute()
    {
        return asset('storage/' . ltrim($this->image_path, '/'));
    }

    /**
     * Get the image path.
     *
     * @return string
     */
    public function getImagePathAttribute($value)
    {
        return $value;
    }

    /**
     * Get the image caption.
     *
     * @return string|null
     */
    public function getCaptionAttribute($value)
    {
        return $value;
    }
}