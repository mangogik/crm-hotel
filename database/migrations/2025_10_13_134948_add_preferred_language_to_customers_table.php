<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // ENUM nullable: 'indonesia' atau 'english'
            $table->enum('preferred_language', ['indonesia', 'english'])
                  ->nullable()
                  ->after('email'); // ubah posisi sesuai kolom yang kamu inginkan
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('preferred_language');
        });
    }
};
