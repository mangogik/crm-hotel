<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1) Tambah kolom FK (nullable dulu) + RESTRICT (bukan SET NULL)
        Schema::table('rooms', function (Blueprint $table) {
            // jika kolom sudah ada karena migrate separuh, lewati
            if (!Schema::hasColumn('rooms', 'room_type_id')) {
                $table->foreignId('room_type_id')
                    ->nullable()
                    ->constrained('room_types')
                    ->restrictOnDelete();
            }
        });

        // 2) Backfill: bentuk tipe berdasar nilai lama di rooms
        // Asumsi kolom lama: room_type (string), capacity (int), price_per_night (decimal)
        if (Schema::hasColumn('rooms', 'room_type')) {
            $types = DB::table('rooms')
                ->select('room_type')
                ->whereNotNull('room_type')
                ->distinct()
                ->pluck('room_type');

            foreach ($types as $name) {
                // ambil 1 sample baris tipe tsb untuk kapasitas & harga
                $sample = DB::table('rooms')
                    ->where('room_type', $name)
                    ->whereNotNull('capacity')
                    ->whereNotNull('price_per_night')
                    ->first(['capacity', 'price_per_night']);

                // fallback kalau null (isi 1 & 0)
                $cap   = $sample->capacity ?? 1;
                $price = $sample->price_per_night ?? 0;

                // buat room_types jika belum ada
                $typeId = DB::table('room_types')->where('name', $name)->value('id');
                if (!$typeId) {
                    $typeId = DB::table('room_types')->insertGetId([
                        'name' => $name,
                        'capacity' => $cap,
                        'price_per_night' => $price,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // set FK di semua rooms dg nama tipe tsb
                DB::table('rooms')->where('room_type', $name)->update(['room_type_id' => $typeId]);
            }
        }

        // 3) Safety fill: pastikan tidak ada NULL sebelum NOT NULL
        // (ambil satu id dari room_types jika ada)
        $someTypeId = DB::table('room_types')->value('id');
        if ($someTypeId) {
            DB::table('rooms')->whereNull('room_type_id')->update(['room_type_id' => $someTypeId]);
        }

        // 3a) Putuskan FK dulu sebelum ubah kolom
        Schema::table('rooms', function (Blueprint $table) {
            // Nama default laravel: rooms_room_type_id_foreign
            // Aman dengan array:
            try {
                $table->dropForeign(['room_type_id']);
            } catch (\Throwable $e) {
                // abaikan kalau sudah ter-drop
            }
        });

        // 3b) Ubah kolom jadi NOT NULL
        Schema::table('rooms', function (Blueprint $table) {
            $table->unsignedBigInteger('room_type_id')->nullable(false)->change();
        });

        // 3c) Pasang lagi FK dengan RESTRICT
        Schema::table('rooms', function (Blueprint $table) {
            $table->foreign('room_type_id')
                ->references('id')
                ->on('room_types')
                ->restrictOnDelete();
        });

        // 4) Hapus kolom lama di rooms: room_type (string), capacity, price_per_night
        Schema::table('rooms', function (Blueprint $table) {
            if (Schema::hasColumn('rooms', 'room_type')) {
                $table->dropColumn('room_type');
            }
            if (Schema::hasColumn('rooms', 'capacity')) {
                $table->dropColumn('capacity');
            }
            if (Schema::hasColumn('rooms', 'price_per_night')) {
                $table->dropColumn('price_per_night');
            }
        });
    }

    public function down(): void
    {
        // 1) Tambahkan kembali kolom lama ke rooms
        Schema::table('rooms', function (Blueprint $table) {
            if (!Schema::hasColumn('rooms', 'room_type')) {
                $table->string('room_type')->nullable();
            }
            if (!Schema::hasColumn('rooms', 'capacity')) {
                $table->unsignedInteger('capacity')->nullable();
            }
            if (!Schema::hasColumn('rooms', 'price_per_night')) {
                $table->decimal('price_per_night', 12, 2)->nullable();
            }
        });

        // 2) Copy balik nilai dari room_types ke rooms (join sederhana)
        $rows = DB::table('rooms')
            ->leftJoin('room_types', 'room_types.id', '=', 'rooms.room_type_id')
            ->select('rooms.id', 'room_types.name', 'room_types.capacity', 'room_types.price_per_night')
            ->get();

        foreach ($rows as $r) {
            DB::table('rooms')->where('id', $r->id)->update([
                'room_type' => $r->name,
                'capacity' => $r->capacity,
                'price_per_night' => $r->price_per_night,
            ]);
        }

        // 3) Drop FK + kolom room_type_id
        Schema::table('rooms', function (Blueprint $table) {
            // drop FK + kolom (dropConstrainedForeignId akan menjatuhkan FK & kolom)
            if (Schema::hasColumn('rooms', 'room_type_id')) {
                try {
                    $table->dropConstrainedForeignId('room_type_id');
                } catch (\Throwable $e) {
                    // fallback jika method di versi lama: dropForeign lalu dropColumn
                    try { $table->dropForeign(['room_type_id']); } catch (\Throwable $e2) {}
                    $table->dropColumn('room_type_id');
                }
            }
        });
    }
};
