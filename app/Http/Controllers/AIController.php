<?php

namespace App\Http\Controllers;

use App\Models\Booking; // Ganti Customer menjadi Booking
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Client\ConnectionException;

class AIController extends Controller
{
    /**
     * Menampilkan halaman awal AI Analytics.
     */
    public function showPage()
    {
        return Inertia::render('AIAnalytics');
    }

    /**
     * Menghasilkan analisis dari data booking dan interaksi.
     */
    public function generateAnalysis(): JsonResponse
    {
        try {
            $apiKey = config('services.gemini.key');
            if (empty($apiKey)) {
                throw new Exception('Konfigurasi API AI tidak ditemukan.');
            }

            // --- PERUBAHAN UTAMA: MENGAMBIL DATA YANG LEBIH KAYA ---
            $bookings = Booking::with(['customer', 'interactions', 'orders.services'])
                ->where('status', 'checked_out') // Analisis dari tamu yang sudah selesai menginap
                ->latest()
                ->limit(50) // Ambil 50 booking terakhir yang sudah selesai
                ->get();

            // Sederhanakan data untuk dikirim ke AI
            $simplifiedData = $this->simplifyDataForAI($bookings);

            // Buat prompt baru yang lebih cerdas
            $prompt = $this->createUpsellingPrompt(json_encode($simplifiedData, JSON_PRETTY_PRINT));

            $response = Http::timeout(120) // Tambah timeout karena prompt lebih kompleks
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                    'contents' => [['parts' => [['text' => $prompt]]]]
                ]);

            if ($response->failed()) {
                Log::error('Gemini API request failed.', ['status' => $response->status(), 'response' => $response->body()]);
                throw new Exception("Gagal menghubungi AI: " . $response->json('error.message', 'Terjadi kesalahan.'));
            }

            $rawText = $response->json('candidates.0.content.parts.0.text');
            if (is_null($rawText)) {
                throw new Exception('AI memberikan respons kosong.');
            }

            $cleanedJsonText = trim(str_replace(['```json', '```'], '', $rawText));
            $analysis = json_decode($cleanedJsonText, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Gemini API returned invalid JSON.', ['raw_text' => $rawText]);
                throw new Exception('AI memberikan format data yang tidak valid.');
            }

            return response()->json($analysis);
        } catch (ConnectionException $e) {
            Log::critical('Could not connect to Gemini API.', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Tidak dapat terhubung ke server AI.'], 500);
        } catch (Exception $e) {
            return response()->json(['error' => 'Terjadi kesalahan: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Menyederhanakan data kompleks menjadi format yang mudah dibaca oleh AI.
     */
    private function simplifyDataForAI($bookings): array
    {
        return $bookings->map(function ($booking) {
            return [
                'customer_country' => $booking->customer->passport_country,
                'room_type' => $booking->room->room_type,
                'stay_duration_days' => $booking->checkin_at->diffInDays($booking->checkout_at),
                'interactions_summary' => $booking->interactions->pluck('interaction_type')->countBy(),
                'services_ordered' => $booking->orders->flatMap(fn($order) => $order->services)->pluck('name'),
            ];
        })->all();
    }

    /**
     * Membuat prompt AI yang fokus pada analisis upselling dan konversi.
     */
    private function createUpsellingPrompt(string $dataJson): string
    {
        // ... (Kode prompt Anda tidak berubah)
        $interactionTerms = json_encode([
            'view_services' => 'Tamu membuka menu layanan untuk pertama kali.',
            'req_svc'       => 'Tamu melihat detail dari sebuah layanan.',
            'ord_svc'       => 'Tamu memilih salah satu opsi layanan.',
            'confirm_ord'   => 'Tamu mengonfirmasi pesanan layanan.',
            'payment'       => 'Tamu memilih metode pembayaran untuk layanan.',
            'cancel'        => 'Tamu membatalkan proses pemesanan.',
        ], JSON_PRETTY_PRINT);

        return <<<PROMPT
Anda adalah Analis Bisnis & Strategi Upselling untuk hotel kami. 
Sistem hotel terintegrasi antara Dashboard (CRUD customers, bookings, rooms, services, orders) dengan n8n, 
yang berfungsi mengirim upselling otomatis melalui bot Telegram saat tamu check-in atau berinteraksi dengan layanan.

Data perilaku tamu berikut diberikan dalam format JSON:
{$dataJson}

**Jangan menuliskan atau menerjemahkan secara literal istilah dalam kamus. Itu hanya sebagai konteks agar anda tau maksud dari istilah yang digunakan sehingga bisa menyusun penjelasan yang utuh dan mudah dipahami. KAMUS INTERAKSI :**
{$interactionTerms}

**BATASAN SISTEM (wajib dipatuhi):**
1. Hanya bisa mengirim pesan teks proaktif kepada tamu melalui bot Telegram.
2. Bisa menampilkan tombol interaktif di bot untuk mengarahkan ke layanan tertentu.
3. Bisa memberikan informasi atau pengingat kepada staf untuk upselling.
4. Dashboard hanya mendukung CRUD untuk customers, bookings, rooms, services, dan orders.

**PANDUAN REKOMENDASI:**
- Fokuskan rekomendasi pada strategi layanan (services).
- Anda boleh memberi insight seperti:
  * Layanan tertentu lebih relevan ditawarkan pada kondisi atau tren tertentu (contoh: saat tamu baru check-in, saat tamu hanya menginap singkat, atau untuk tamu di tipe kamar tertentu).
  * Layanan tertentu sebaiknya ditawarkan bersama layanan lain agar meningkatkan peluang konversi.
  * Ada layanan yang jarang dipilih dan sebaiknya dipromosikan lebih kuat atau dievaluasi efektivitasnya.
- Jangan pernah merekomendasikan perubahan teknis pada sistem.
- Pastikan semua rekomendasi dapat dijalankan dengan kemampuan bot Telegram atau staf hotel.

**TUGAS ANDA:**
1. Summary: Ringkasan singkat pola perilaku tamu.
2. Trends: Identifikasi 3 tren utama (peluang terlewat, produk unggulan, korelasi perilaku).
3. Recommendations: Berikan 3 rekomendasi aksi yang konkret, fokus pada strategi promosi/penggunaan layanan, sesuai batasan di atas.

**ATURAN FORMAT RESPON:**
Penting: Jawab HANYA dengan JSON valid sesuai struktur, tanpa teks tambahan, tanpa komentar.
- Output HARUS dalam format JSON valid.
- Gunakan bahasa profesional, natural, dan mudah dipahami.
- Gunakan istilah interaksi sesuai kamus di atas.
- Jangan gunakan format Markdown.

**STRUKTUR JSON YANG WAJIB:**
{
  "summary": "Ringkasan singkat perilaku tamu.",
  "trends": [
    "Tren pertama",
    "Tren kedua",
    "Tren ketiga"
  ],
  "recommendations": [
    "Rekomendasi pertama",
    "Rekomendasi kedua",
    "Rekomendasi ketiga"
  ]
}
PROMPT;
    }


    public function listModels()
    {
        try {
            $apiKey = config('services.gemini.key');
            if (empty($apiKey)) {
                return "API Key Gemini tidak ditemukan.";
            }

            // Endpoint untuk mendaftar model
            $url = "https://generativelanguage.googleapis.com/v1beta/models?key={$apiKey}";

            $response = Http::get($url);

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Gagal mengambil daftar model dari Google.',
                    'status' => $response->status(),
                    'response' => $response->body(),
                ], 500);
            }

            // Tampilkan daftar model yang tersedia
            dd($response->body());
        } catch (Exception $e) {
            return "Terjadi kesalahan: " . $e->getMessage();
        }
    }

    /**
     * Bertindak sebagai proxy aman untuk AIEditor.
     * Menerima request dari editor, menambahkan API key, dan meneruskan ke Gemini.
     */
    public function proxyAIEditor(Request $request): JsonResponse
    {
        try {
            // 1. Ambil API Key (menggunakan cara Anda yang sudah ada)
            $apiKey = config('services.gemini.key'); //
            if (empty($apiKey)) {
                throw new Exception('Konfigurasi API AI tidak ditemukan.');
            }

            // 2. Ambil data dari aieditor
            // 'aieditor' mengirim 'prompt' dan 'model'
            $prompt = $request->input('prompt');
            if (empty($prompt)) {
                return response()->json(['error' => 'Prompt tidak boleh kosong.'], 400);
            }

            $model = $request->input('model', 'gemini-2.5-flash');

            // Dan pastikan endpoint versi baru:
            $apiUrl = "https://generativelanguage.googleapis.com/v1/models/{$model}:generateContent?key={$apiKey}";
            // 4. Buat payload untuk Gemini (menggunakan format Anda)
            $payload = [
                'contents' => [['parts' => [['text' => $prompt]]]] //
            ];

            // 5. Kirim ke Gemini (menggunakan Http client Anda)
            $response = Http::timeout(60) // 60 detik timeout untuk editing
                ->post($apiUrl, $payload); //

            if ($response->failed()) { //
                Log::error('AIEDITOR_PROXY: Gemini API request failed.', ['status' => $response->status(), 'response' => $response->body()]);
                throw new Exception("Gagal menghubungi AI: " . $response->json('error.message', 'Terjadi kesalahan.'));
            }

            // 6. Ambil teks (menggunakan cara Anda)
            $aiText = $response->json('candidates.0.content.parts.0.text'); //
            if (is_null($aiText)) {
                throw new Exception('AI memberikan respons kosong.');
            }

            // 7. Kembalikan dalam format yang diharapkan aieditor
            return response()->json([
                'result' => $aiText
            ]);
        } catch (ConnectionException $e) {
            Log::critical('AIEDITOR_PROXY: Could not connect to Gemini API.', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Tidak dapat terhubung ke server AI.'], 500);
        } catch (Exception $e) {
            return response()->json(['error' => 'Terjadi kesalahan: ' . $e->getMessage()], 500);
        }
    }
}
