<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // tambahkan tipe baru ke enum
            $table->enum('type', [
                'fixed',
                'per_unit',
                'selectable',
                'free',
                'multiple_options'
            ])->default('fixed')->change();
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            // rollback ke enum sebelumnya
            $table->enum('type', [
                'fixed',
                'per_unit',
                'selectable',
                'free'
            ])->default('fixed')->change();
        });
    }
};

