<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('name');
        });

        // Backfill slug dari name (pastikan unik)
        $services = DB::table('services')->select('id', 'name')->get();
        $used = [];
        foreach ($services as $s) {
            $base = Str::slug($s->name ?? 'service');
            $slug = $base;
            $i = 2;
            while (isset($used[$slug]) || DB::table('services')->where('slug', $slug)->exists()) {
                $slug = $base.'-'.$i++;
            }
            $used[$slug] = true;
            DB::table('services')->where('id', $s->id)->update(['slug' => $slug]);
        }

        Schema::table('services', function (Blueprint $table) {
            $table->string('slug')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};
