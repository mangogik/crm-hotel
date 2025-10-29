<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom booking_id (nullable) + FK ke bookings.id
     * Tambah unique index (customer_id, intent) agar idempoten saat upsert
     */
    public function up(): void
    {
        Schema::table('pending_interactions', function (Blueprint $table) {
            // booking_id opsional—saat user belum pilih booking, biarkan null
            $table->unsignedBigInteger('booking_id')->nullable()->after('customer_id');

            // Foreign key (hapus relasi booking diset NULL)
            $table->foreign('booking_id')
                ->references('id')->on('bookings')
                ->nullOnDelete();

            // Unique index untuk memudahkan ON DUPLICATE KEY UPDATE (customer+intent)
            // -> pastikan belum ada unique serupa sebelumnya
            $table->unique(['customer_id', 'intent'], 'pi_customer_intent_unique');

            // (Opsional) index tambahan untuk query by state
            // $table->index(['customer_id', 'state'], 'pi_customer_state_idx');
        });
    }

    /**
     * Rollback perubahan
     */
    public function down(): void
    {
        Schema::table('pending_interactions', function (Blueprint $table) {
            // Drop FK dulu baru kolom
            $table->dropForeign(['booking_id']);
            $table->dropColumn('booking_id');

            // Hapus unique index
            $table->dropUnique('pi_customer_intent_unique');

            // (Jika sebelumnya dibuat) hapus index tambahan
            // $table->dropIndex('pi_customer_state_idx');
        });
    }
};
