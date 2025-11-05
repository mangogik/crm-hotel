<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            // Tambahkan kolom slug setelah 'room_number'
            // Dibuat 'unique' agar tidak ada 2 kamar dengan slug yang sama
            // Dibuat 'nullable' untuk keamanan jika ada kamar lama yang belum punya slug
            $table->string('slug')->unique()->nullable()->after('room_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            // Hapus unique index dulu, baru hapus kolomnya
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};
