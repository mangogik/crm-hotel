<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['checkin_at', 'checkout_at']);
            $table->integer('total_visits')->default(1)->after('passport_country');
            $table->date('last_visit_date')->nullable()->after('total_visits');
        });
    }

    public function down()
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->datetime('checkin_at')->nullable();
            $table->datetime('checkout_at')->nullable();
            $table->dropColumn(['total_visits', 'last_visit_date']);
        });
    }
};