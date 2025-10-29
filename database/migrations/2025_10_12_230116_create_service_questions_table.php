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
        Schema::create('service_questions', function (Blueprint $table) {
            $table->id();
            
            // Menghubungkan ke tabel services. Jika service dihapus, pertanyaannya juga ikut terhapus.
            $table->foreignId('service_id')->constrained()->onDelete('cascade');
            
            // Nomor versi untuk set pertanyaan ini, dimulai dari 1 untuk setiap service.
            $table->unsignedInteger('version')->default(1);
            
            // Penanda apakah versi ini yang aktif digunakan untuk order baru.
            $table->boolean('is_active')->default(true);
            
            // Menyimpan daftar pertanyaan dalam format JSON.
            // Contoh: ["Ukuran?", "Warna?", "Instruksi Khusus?"]
            $table->json('questions_json');
            
            $table->timestamps();

            // Memastikan tidak ada versi duplikat untuk service yang sama.
            $table->unique(['service_id', 'version']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_questions');
    }
};
