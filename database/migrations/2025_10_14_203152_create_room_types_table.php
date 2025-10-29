<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('room_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->unsignedInteger('capacity');
            $table->decimal('price_per_night', 12, 2);
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('room_types');
    }
};
