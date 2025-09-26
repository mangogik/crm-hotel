<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->enum('membership_type', ['regular', 'silver', 'gold', 'platinum'])->default('regular');
            $table->date('join_date');
            $table->integer('total_bookings')->default(1);
            $table->decimal('discount_percentage', 5, 2)->default(0.00);
            $table->timestamps();
            
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->unique('customer_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('memberships');
    }
};