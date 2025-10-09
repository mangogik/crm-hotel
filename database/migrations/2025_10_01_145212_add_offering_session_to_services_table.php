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
        Schema::table('services', function (Blueprint $table) {
            // Menambahkan kolom baru 'offering_session' setelah kolom 'options'
            $table->enum('offering_session', [
                'pre_checkin', 
                'post_checkin', 
                'pre_checkout', 
            ])
            ->default('post_checkin')
            ->after('options')
            ->comment('Sesi kapan layanan ini paling relevan untuk ditawarkan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // Menghapus kolom 'offering_session' jika migrasi di-rollback
            $table->dropColumn('offering_session');
        });
    }
};