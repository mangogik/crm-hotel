<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ubah kolom `type` menjadi ENUM termasuk 'free'
        DB::statement("
            ALTER TABLE `services`
            MODIFY COLUMN `type` ENUM('fixed','per_unit','selectable','free')
            NOT NULL DEFAULT 'fixed'
        ");
    }

    public function down(): void
    {
        // Kembalikan ke ENUM tanpa 'free' (atau ke VARCHAR jika sebelumnya string)
        // Opsi A (kembali ke VARCHAR):
        // DB::statement(\"ALTER TABLE `services` MODIFY COLUMN `type` VARCHAR(255) NOT NULL DEFAULT 'fixed'\");
        //
        // Opsi B (kembali ke ENUM awal tanpa 'free'):
        DB::statement("
            ALTER TABLE `services`
            MODIFY COLUMN `type` ENUM('fixed','per_unit','selectable')
            NOT NULL DEFAULT 'fixed'
        ");
    }
};
