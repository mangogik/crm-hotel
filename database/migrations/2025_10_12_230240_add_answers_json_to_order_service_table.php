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
        Schema::table('order_service', function (Blueprint $table) {
            // Kolom baru untuk menyimpan snapshot pertanyaan dan jawaban.
            // Ditempatkan setelah kolom 'details' agar rapi.
            $table->json('answers_json')->nullable()->after('details');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_service', function (Blueprint $table) {
            $table->dropColumn('answers_json');
        });
    }
};
