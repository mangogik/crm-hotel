<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Setting;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Prefetch vite chunks
        Vite::prefetch(concurrency: 3);

        /**
         * SHARE AUTH USER (biar layout ga perlu pass props manual)
         */
        Inertia::share('auth', function () {
            return [
                'user' => Auth::user(),
            ];
        });

        /**
         * SHARE BRANDING / CONTACT KE SEMUA HALAMAN
         * -> ini non-sensitif, aman buat ditaruh di public page (catalog) juga
         */
        Inertia::share('site', function () {
            // Ambil kumpulan setting yang sifatnya publik (branding & contact)
            $settings = Setting::query()
                ->whereIn('key', [
                    'hotel_name',
                    'hotel_tagline',
                    'hotel_logo_url',
                    'hotel_phone',
                    'hotel_email',
                    'hotel_address',
                    'hotel_hours',
                    'support_whatsapp_number',
                    'support_instagram_url',
                    'support_facebook_url',
                ])
                ->pluck('value', 'key');

            // Helper kecil
            $get = function ($key, $fallback = null) use ($settings) {
                return $settings[$key] ?? $fallback;
            };

            // base URL untuk ambil asset dari DASHBOARD app (misal http://localhost:8000)
            $assetBase = rtrim(env('APP_DASHBOARD_ASSET_BASE', ''), '/');

            // path logo mentah di DB (contoh: /storage/logos/irLhjPninwM....jpg)
            $rawLogoPath = $get('hotel_logo_url');

            // Build full absolute URL buat dipakai langsung di <img src="">
            // result: http://localhost:8000/storage/logos/xxx.jpg
            $fullLogoUrl = null;
            if ($assetBase && $rawLogoPath) {
                $fullLogoUrl = $assetBase . '/' . ltrim($rawLogoPath, '/');
            }

            return [
                // Branding
                'name'    => $get('hotel_name', 'Hotel'),
                'tagline' => $get('hotel_tagline', 'Boutique comfort in the heart of the city.'),
                'logo'    => $fullLogoUrl,

                // Contact / info
                'phone'   => $get('hotel_phone'),
                'email'   => $get('hotel_email'),
                'address' => $get('hotel_address'),
                'hours'   => $get('hotel_hours'),

                // Social
                'whatsapp'  => $get('support_whatsapp_number', ''),
                'instagram' => $get('support_instagram_url', ''),
                'facebook'  => $get('support_facebook_url', ''),

                // Legal/footer
                'company' => 'PT Tohjaya Digital Solution',
                'url'     => $assetBase ?: 'http://localhost:8000',
            ];
        });

        /**
         * SHARE ADVANCED / SECRET CONFIG KE DASHBOARD
         * -> dipakai JS buat call n8n, Gemini, dsb.
         * -> kita expose hanya kalau user sudah login.
         * -> kalau mau extra safety, tambahin pengecekan role di sini.
         */
        Inertia::share('secrets', function () {
            $user = Auth::user();

            if (!$user) {
                // kalau belum login, jangan kirim apa-apa
                return null;
            }

            // Ambil setting advanced+secret dari DB
            $settings = Setting::query()
                ->whereIn('key', [
                    'n8n_secret_token',
                    'gemini_api_key',
                    'n8n_order_webhook_url',
                ])
                ->pluck('value', 'key');

            // Helper buat masking string kalau mau ditampilkan di UI (opsional)
            $mask = function ($val) {
                if (!$val) return '';
                // contoh "sk-abcdef123456" -> "sk-ab***3456"
                $len = strlen($val);
                if ($len <= 6) return str_repeat('*', $len);
                $head = substr($val, 0, 4);
                $tail = substr($val, -4);
                return $head . '***' . $tail;
            };

            return [
                // nilai mentah (full). ini yang JS logic kamu bisa pakai langsung:
                'raw' => [
                    'n8n_secret_token'      => $settings['n8n_secret_token']      ?? null,
                    'gemini_api_key'        => $settings['gemini_api_key']        ?? null,
                    'n8n_order_webhook_url' => $settings['n8n_order_webhook_url'] ?? null,
                ],

                // versi aman buat di-preview di UI (misal di Settings page)
                'preview' => [
                    'n8n_secret_token'      => $mask($settings['n8n_secret_token']      ?? null),
                    'gemini_api_key'        => $mask($settings['gemini_api_key']        ?? null),
                    'n8n_order_webhook_url' => $settings['n8n_order_webhook_url'] ?? null,
                    // webhook URL biasanya gak rahasia, jadi gak perlu mask
                ],
            ];
        });
    }
}
