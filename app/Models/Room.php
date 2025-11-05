<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str; // <-- 1. DITAMBAHKAN

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_number',
        'room_type_id',
        'status',
        'slug', // <-- 2. DITAMBAHKAN
    ];

    /* ----------------- Relationships ----------------- */

    public function roomType()
    {
        return $this->belongsTo(RoomType::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * 3. TAMBAHKAN FUNGSI RELASI GAMBAR INI
     * Mendapatkan semua gambar untuk kamar ini.
     */
    public function images()
    {
        // Pastikan nama Model 'RoomImage' sudah benar
        return $this->hasMany(RoomImage::class);
    }


    /* ----------------- Helpers / Boot Methods ----------------- */

    /**
     * 4. TAMBAHKAN SELURUH BLOK FUNGSI BOOT INI
     * (Meniru logika slug dari Model Service Anda)
     */
    protected static function boot()
    {
        parent::boot();

        /**
         * Saat membuat Room baru, generate slug dari room_number.
         */
        static::creating(function ($room) {
            if (empty($room->slug) && !empty($room->room_number)) {
                $room->slug = static::generateUniqueSlug($room->room_number);
            }
        });

        /**
         * Saat mengupdate Room, generate ulang slug jika room_number berubah.
         */
        static::updating(function ($room) {
            if ($room->isDirty('room_number') || (empty($room->slug) && !empty($room->room_number))) {
                $room->slug = static::generateUniqueSlug($room->room_number, $room->id);
            }
        });
    }

    /**
     * Helper untuk membuat slug yang unik.
     */
    protected static function generateUniqueSlug(string $roomNumber, $ignoreId = null): string
    {
        // Gunakan room_number sebagai dasar slug
        $base = Str::slug($roomNumber, '-');
        $slug = $base;
        $i = 2;

        $query = static::query()->where('slug', $slug);

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        // Cek jika slug sudah ada, tambahkan angka (cth: kamar-101-2)
        while ($query->clone()->exists()) {
            $slug = $base . '-' . $i++;
            $query = static::query()->where('slug', $slug); // Reset query builder untuk loop berikutnya
            if ($ignoreId) {
                $query->where('id', '!=', $ignoreId);
            }
        }

        return $slug;
    }
}
