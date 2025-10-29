<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pending_interactions', function (Blueprint $table) {
            $table->id();
            
            // Link to the customers table.
            // onDelete('cascade') means if a customer is deleted, their pending interactions are also automatically deleted.
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            
            // Stores the user's original goal (e.g., 'change_language', 'request_service')
            $table->string('intent');
            
            // Stores the array of booking choices as an efficient JSON string.
            $table->json('context');
            
            // Automatically creates created_at and updated_at columns.
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pending_interactions');
    }
};