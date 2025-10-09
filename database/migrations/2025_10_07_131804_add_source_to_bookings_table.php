<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // MySQL: enum
            if (Schema::hasColumn('bookings', 'source') === false) {
                $table->enum('source', ['direct', 'ota', 'agent'])
                      ->default('direct')
                      ->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bookings', 'source')) {
                $table->dropColumn('source');
            }
        });
    }
};
