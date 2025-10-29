<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    public function up(): void
    {
        // --- 1. Tabel untuk gambar umum service ---
        Schema::create('service_images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('service_id');
            $table->string('image_path');
            $table->string('caption')->nullable();
            $table->timestamps();

            $table->foreign('service_id')->references('id')->on('services')->onDelete('cascade');
        });

        // --- 2. Tabel untuk gambar per-option ---
        Schema::create('service_option_images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('service_id');
            $table->string('option_key'); // misal: "opt_1", "opt_2"
            $table->string('option_name'); // untuk referensi cepat
            $table->string('image_path');
            $table->string('caption')->nullable();
            $table->timestamps();

            $table->foreign('service_id')->references('id')->on('services')->onDelete('cascade');
        });

        // --- 3. Update kolom options lama agar punya key ---
        $services = DB::table('services')
            ->whereIn('type', ['selectable', 'multiple_options'])
            ->get();

        foreach ($services as $service) {
            if (!$service->options) continue;

            try {
                $options = json_decode($service->options, true);
                if (!is_array($options)) continue;

                $newOptions = [];
                foreach ($options as $index => $opt) {
                    $newOptions[] = [
                        'key' => $opt['key'] ?? 'opt_' . ($index + 1),
                        'name' => $opt['name'] ?? ('Option ' . ($index + 1)),
                        'price' => $opt['price'] ?? 0,
                    ];
                }

                DB::table('services')
                    ->where('id', $service->id)
                    ->update(['options' => json_encode($newOptions, JSON_UNESCAPED_UNICODE)]);
            } catch (\Throwable $e) {
                Log::error('Failed to update options for service ID ' . $service->id . ': ' . $e->getMessage());
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('service_option_images');
        Schema::dropIfExists('service_images');
    }
};
