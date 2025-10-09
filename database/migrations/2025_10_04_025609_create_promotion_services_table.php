<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotion_services', function (Blueprint $table) {
            $table->foreignId('promotion_id')->constrained('promotions')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained('services')->restrictOnDelete();

            // Jika ada baris di pivot -> promo hanya berlaku untuk layanan ini.
            // Jika TIDAK ada baris -> promo berlaku untuk seluruh layanan.
            $table->primary(['promotion_id', 'service_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotion_services');
    }
};
