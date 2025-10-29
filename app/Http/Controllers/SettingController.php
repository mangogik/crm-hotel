<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class SettingController extends Controller
{
    /**
     * GET /settings
     * Kirim semua setting ke FE dalam bentuk keyed-by-key (seperti sebelumnya).
     */
    public function index()
    {
        $settings = Setting::all()
            ->keyBy('key')
            ->map(fn ($row) => [
                'value'       => $row->value,
                'type'        => $row->type,
                'group'       => $row->group,
                'description' => $row->description,
            ]);

        return Inertia::render('Settings', [
            'settings' => $settings,
        ]);
    }

    /**
     * POST/PATCH /settings
     *
     * Tujuan baru:
     * - Dinamis. Key baru boleh langsung ikut.
     * - Logo (file) tetap ditangani khusus.
     * - Secret tidak dipaksa overwrite kalau tidak dikirim.
     *
     * Konvensi FE:
     * - Semua field dikirim sebagai form-data (multipart/form-data),
     *   contoh:
     *     hotel_name = "Wavin Hotel"
     *     n8n_order_webhook_url = "https://...."
     *     n8n_secret_token = "abc123"
     *     hotel_logo_file = (file)
     *
     * Catatan:
     *   - Kita akan anggap SEMUA field non-file valid selama string <= 2000 char.
     *   - Jadi kamu gak perlu nambahin mereka ke whitelist di kode.
     */
    public function update(Request $request)
    {
        /**
         * 1. VALIDASI DASAR (generik)
         *
         * Karena dynamic, kita gak bisa hardcode semua key.
         * Tapi kita tetap mau nge-guard supaya gak ada upload file aneh.
         *
         * - Semua field biasa (string) -> nullable|string|max:2000
         * - File 'hotel_logo_file' -> file image 2MB
         *
         * Kita gak bisa tulis rule untuk semua key satu per satu karena key-nya fleksibel.
         * Jadi pendekatannya:
         *   a) Validasi file secara eksplisit
         *   b) Validasi text secara manual runtime
         */

        $request->validate([
            'hotel_logo_file' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
        ]);

        // validasi generik untuk semua input string selain file
        // (kita akan loop satu2 dan pastikan panjangnya aman)
        $MAX_LEN = 2000;

        foreach ($request->except(['hotel_logo_file']) as $key => $val) {
            // hanya izinkan scalar (string/number/null). Array kompleks gak kita terima di controller ini
            if (is_array($val)) {
                return back()->withErrors([
                    $key => 'Array is not allowed for this setting.'
                ]);
            }

            if (!is_null($val) && strlen((string)$val) > $MAX_LEN) {
                return back()->withErrors([
                    $key => "Value too long (max {$MAX_LEN} chars)."
                ]);
            }
        }

        /**
         * 2. HANDLE LOGO FILE (opsional)
         *
         * Kalau ada file upload, kita simpan ke storage/public/logos/
         * lalu kita simpan path finalnya di key 'hotel_logo_url'.
         */
        if ($request->hasFile('hotel_logo_file')) {
            $file = $request->file('hotel_logo_file');

            $path = $file->store('logos', 'public'); // ex: "logos/abc123.png"

            $this->upsertSettingDynamic(
                'hotel_logo_url',
                '/storage/' . $path,
                // type/group/desc default:
                // ini bisa coba di-deduce,
                // tapi untuk logo kita override manual agar rapi
                $type        = 'image',
                $group       = 'branding',
                $description = 'Logo utama hotel'
            );
        }

        /**
         * 3. UPSERT SEMUA FIELD LAIN (DINAMIS)
         *
         * Rules penting:
         * - Kalau key itu 'hotel_logo_file', kita skip (sudah ditangani di atas).
         * - Kalau key secret ada tapi user kirim string kosong?
         *   -> kita tetap simpan kosong. (jadi admin bisa clear token)
         * - Kalau key secret TIDAK dikirim sama sekali
         *   -> kita jangan sentuh row lamanya.
         *
         * Kita perlu tau data existing supaya bisa bedain mana secret lama yang tidak dikirim.
         */
        $existingSettings = Setting::all()->keyBy('key');

        // loop semua key dari request (kecuali file)
        foreach ($request->except(['hotel_logo_file']) as $key => $val) {
            $val = $val ?? ''; // normalisasi null jadi '' biar konsisten

            // ambil row lama (kalau ada)
            $old = $existingSettings->get($key);

            // Apakah key ini dianggap "secret"?
            // Aturan: kalau sudah pernah disimpan type = 'secret', kita anggap secret.
            $isSecret = $old && ($old->type === 'secret');

            // Case: secret lama ADA di DB, tapi field TIDAK ikut di-request? -> jangan diubah.
            // Kita handle itu dengan cara: loop kita cuma untuk key yang ada di request.
            // Jadi kalau FE tidak mengirim `n8n_secret_token`, row lamanya aman.

            // Guess metadata (type/group/desc)
            // - Kalau setting sudah ada → pakai metadata lama.
            // - Kalau belum ada → kita coba generate otomatis.
            $metaType        = $old->type ?? $this->guessTypeForKey($key);
            $metaGroup       = $old->group ?? $this->guessGroupForKey($key);
            $metaDescription = $old->description ?? $this->guessDescriptionForKey($key);

            // Upsert
            $this->upsertSettingDynamic(
                $key,
                $val,
                $metaType,
                $metaGroup,
                $metaDescription
            );
        }

        return redirect()
            ->route('settings.index')
            ->with('success', 'Settings updated.');
    }

    /**
     * Upsert setting dinamis.
     * - Kalau ada: update value + keep metadata (kecuali kita override di argumen)
     * - Kalau tidak ada: bikin baru pakai metadata yang kita kirim.
     *
     * NOTE:
     *   Controller kita udah nentuin type/group/description final,
     *   jadi fungsi ini simple banget.
     */
    protected function upsertSettingDynamic(
        string $key,
        string $value,
        string $type,
        string $group,
        string $description
    ) {
        Setting::updateOrCreate(
            ['key' => $key],
            [
                'value'       => $value,
                'type'        => $type,
                'group'       => $group,
                'description' => $description,
            ]
        );

        // optional: clear cache yang kita pakai di Setting::getValue()
        cache()->forget("setting_{$key}");
    }

    /**
     * Tebak group default jika setting baru belum pernah ada.
     * Kita pakai heuristic ringan berdasarkan prefix.
     */
    protected function guessGroupForKey(string $key): string
    {
        if (str_starts_with($key, 'hotel_'))   return 'branding';
        if (str_starts_with($key, 'support_')) return 'contact';
        if (str_starts_with($key, 'n8n_'))     return 'advanced';
        if (str_starts_with($key, 'gemini_'))  return 'advanced';

        return 'general';
    }

    /**
     * Tebak type default untuk setting baru.
     * - kalau mengandung kata 'token' atau 'api_key' → secret
     * - kalau 'url' → string (tetap string biasa tapi FE bisa treat sebagai URL)
     * - sisanya 'string'
     */
    protected function guessTypeForKey(string $key): string
    {
        $lower = strtolower($key);

        if (str_contains($lower, 'token'))   return 'secret';
        if (str_contains($lower, 'api_key')) return 'secret';

        if (str_contains($lower, 'logo'))    return 'image';
        if (str_contains($lower, 'url'))     return 'string';

        return 'string';
    }

    /**
     * Deskripsi default biar gak kosong banget (fallback).
     * Kalau key baru tidak dikenali maka kita cuma pakai nama key mentah.
     */
    protected function guessDescriptionForKey(string $key): string
    {
        return match ($key) {
            'hotel_name'               => 'Nama hotel yang ditampilkan di header dan footer.',
            'hotel_tagline'            => 'Tagline singkat hotel.',
            'hotel_phone'              => 'Nomor telepon utama hotel.',
            'hotel_email'              => 'Email customer service hotel.',
            'hotel_address'            => 'Alamat lengkap hotel.',
            'hotel_hours'              => 'Jam operasional customer support.',
            'hotel_logo_url'           => 'Logo utama hotel.',
            'support_whatsapp_number'  => 'Nomor WhatsApp untuk customer support.',
            'support_instagram_url'    => 'Link Instagram hotel.',
            'support_facebook_url'     => 'Link Facebook hotel.',
            'n8n_secret_token'         => 'Token keamanan untuk webhook n8n.',
            'n8n_order_webhook_url'    => 'Endpoint webhook n8n ketika order dibuat.',
            'gemini_api_key'           => 'API key untuk Gemini AI.',
            default                    => $key,
        };
    }
}
