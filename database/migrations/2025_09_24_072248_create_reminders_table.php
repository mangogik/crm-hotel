<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            $table->enum('reminder_type', ['pending_order', 'pending_checkin', 'pending_checkout', 'review_request']);
            $table->unsignedBigInteger('target_id');
            $table->enum('target_type', ['order', 'booking']);
            $table->datetime('scheduled_at');
            $table->enum('status', ['pending', 'sent', 'cancelled'])->default('pending');
            $table->datetime('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('reminders');
    }
};