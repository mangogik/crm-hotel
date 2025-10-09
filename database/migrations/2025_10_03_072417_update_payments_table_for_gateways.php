<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private string $table = 'payments';

    // helpers untuk cek index/unique tanpa doctrine
    private function indexExists(string $indexName): bool
    {
        $db = DB::getDatabaseName();
        $res = DB::select("
            SELECT 1
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
            LIMIT 1
        ", [$db, $this->table, $indexName]);
        return !empty($res);
    }

    public function up(): void
    {
        // 1) Tambah kolom-kolom baru bila belum ada
        Schema::table($this->table, function (Blueprint $table) {
            if (!Schema::hasColumn($this->table, 'method')) {
                // metode aktual transaksi (cash/online)
                $table->enum('method', ['cash', 'online'])
                      ->nullable()
                      ->after('amount')
                      ->comment('Actual payment method used');
            }

            if (!Schema::hasColumn($this->table, 'currency')) {
                $table->string('currency', 10)
                      ->default('IDR')
                      ->after('method');
            }

            if (!Schema::hasColumn($this->table, 'paid_at')) {
                $table->timestamp('paid_at')->nullable()->after('status');
            }

            if (!Schema::hasColumn($this->table, 'invoice_id')) {
                $table->string('invoice_id', 100)->nullable()->after('external_id');
            }

            if (!Schema::hasColumn($this->table, 'payment_url')) {
                $table->text('payment_url')->nullable()->after('invoice_id');
            }

            if (!Schema::hasColumn($this->table, 'failure_reason')) {
                $table->text('failure_reason')->nullable()->after('payment_url');
            }
        });

        // 2) Ubah ENUM status agar mendukung 'refunded' (tanpa doctrine)
        // catatan: ini aman untuk MySQL/MariaDB 10.x
        DB::statement("
            ALTER TABLE `{$this->table}`
            MODIFY `status` ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending'
        ");

        // 3) Tambah UNIQUE pada external_id (jika belum ada)
        if (!$this->indexExists('payments_external_id_unique')) {
            DB::statement("
                ALTER TABLE `{$this->table}`
                ADD UNIQUE `payments_external_id_unique` (`external_id`)
            ");
        }

        // 4) Tambah index (status, created_at) untuk laporan (jika belum ada)
        if (!$this->indexExists('payments_status_created_at_index')) {
            DB::statement("
                CREATE INDEX `payments_status_created_at_index`
                ON `{$this->table}` (`status`, `created_at`)
            ");
        }
    }

    public function down(): void
    {
        // rollback index/unique jika ada
        if ($this->indexExists('payments_status_created_at_index')) {
            DB::statement("DROP INDEX `payments_status_created_at_index` ON `{$this->table}`");
        }
        if ($this->indexExists('payments_external_id_unique')) {
            DB::statement("
                ALTER TABLE `{$this->table}` DROP INDEX `payments_external_id_unique`
            ");
        }

        // kembalikan ENUM status ke awal (tanpa 'refunded')
        DB::statement("
            ALTER TABLE `{$this->table}`
            MODIFY `status` ENUM('pending','paid','failed') NOT NULL DEFAULT 'pending'
        ");

        // hapus kolom-kolom baru jika ada
        Schema::table($this->table, function (Blueprint $table) {
            if (Schema::hasColumn($this->table, 'failure_reason')) {
                $table->dropColumn('failure_reason');
            }
            if (Schema::hasColumn($this->table, 'payment_url')) {
                $table->dropColumn('payment_url');
            }
            if (Schema::hasColumn($this->table, 'invoice_id')) {
                $table->dropColumn('invoice_id');
            }
            if (Schema::hasColumn($this->table, 'paid_at')) {
                $table->dropColumn('paid_at');
            }
            if (Schema::hasColumn($this->table, 'currency')) {
                $table->dropColumn('currency');
            }
            if (Schema::hasColumn($this->table, 'method')) {
                $table->dropColumn('method');
            }
        });
    }
};
