<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomImage extends Model
{
    use HasFactory;

    /**
     * Nama tabel yang terkait dengan model.
     *
     * @var string
     */
    protected $table = 'room_images';

    /**
     * Atribut yang dapat diisi secara massal.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'room_id',
        'image_path',
        'caption',
    ];

    /**
     * Mendapatkan kamar yang memiliki gambar ini.
     */
    public function room()
    {
        return $this->belongsTo(Room::class);
    }
}
