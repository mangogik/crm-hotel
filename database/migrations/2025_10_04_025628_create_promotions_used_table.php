<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions_used', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('promotion_id')->constrained('promotions')->restrictOnDelete();

            // nominal diskon yang benar-benar diterapkan
            $table->decimal('discount_applied', 12, 2)->default(0);

            // bila aksi promo berupa free service
            $table->foreignId('free_service_id')->nullable()
                  ->constrained('services')->nullOnDelete();
            $table->unsignedInteger('free_service_qty')->nullable();

            // snapshot opsional (kondisi saat apply: subtotal, tier, dll.)
            $table->json('snapshot_json')->nullable();

            $table->timestamps();

            $table->index(['order_id', 'promotion_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotions_used');
    }
};
