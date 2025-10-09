<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('name');

            // 3 tipe sederhana: birthday / event / membership
            $table->enum('type', ['birthday', 'event', 'membership']);

            // aktif/non-aktif manual (tanpa start/end date)
            $table->boolean('active')->default(true)->index();

            // Aksi promo: pilih salah satu yang terisi
            $table->unsignedTinyInteger('discount_percent')->nullable(); // 0..100
            $table->decimal('discount_amount', 12, 2)->nullable();       // jika nominal

            // Free service (opsional)
            $table->foreignId('free_service_id')->nullable()
                  ->constrained('services')->nullOnDelete();
            $table->unsignedInteger('free_service_qty')->default(1);

            // Parameter sesuai tipe
            $table->unsignedTinyInteger('birthday_days_before')->default(3);
            $table->string('membership_tier', 50)->nullable();
            $table->string('event_code', 100)->nullable();

            $table->timestamps();

            // bantu filter cepat
            $table->index(['type', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};
