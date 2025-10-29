<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1) Pastikan data lama di-normalisasi ke kode baru sebelum ubah enum
        DB::table('customers')
            ->where('preferred_language', 'indonesia')
            ->update(['preferred_language' => 'id']);

        DB::table('customers')
            ->where('preferred_language', 'english')
            ->update(['preferred_language' => 'en']);

        // 2) Ubah definisi enum kolom → ('id','en') NULL
        //    Gunakan raw SQL agar tidak perlu doctrine/dbal.
        DB::statement("
            ALTER TABLE customers
            MODIFY COLUMN preferred_language ENUM('id','en') NULL
        ");
    }

    public function down(): void
    {
        // Rollback enum ke nilai lama ('indonesia','english')
        DB::statement("
            ALTER TABLE customers
            MODIFY COLUMN preferred_language ENUM('indonesia','english') NULL
        ");

        // Kembalikan data ke bentuk lama
        DB::table('customers')
            ->where('preferred_language', 'id')
            ->update(['preferred_language' => 'indonesia']);

        DB::table('customers')
            ->where('preferred_language', 'en')
            ->update(['preferred_language' => 'english']);
    }
};
