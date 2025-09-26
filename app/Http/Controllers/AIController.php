<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log; // <-- 1. Impor Log facade
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
     * Menghasilkan analisis dari data customer.
     */
    public function generateAnalysis(): JsonResponse
    {
        try {
            $apiKey = config('services.gemini.key');
            if (empty($apiKey)) {
                Log::error('Gemini API key is not set in .env file or config cache is not cleared.');
                throw new Exception('Konfigurasi API AI tidak ditemukan. Harap hubungi administrator.');
            }

            $customers = Customer::latest()->limit(50)->get(['name', 'passport_country',]);
            if ($customers->count() < 10) {
                return response()->json([
                    'summary' => 'Data customer tidak cukup untuk dianalisis (kurang dari 10).',
                    'trends' => [],
                    'recommendations' => []
                ]);
            }

            // Buat prompt dan panggil API
            $prompt = $this->createCustomerPrompt($customers->toJson());

            $response = Http::timeout(60)
                ->retry(3, 100) // <-- TAMBAHKAN INI
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={$apiKey}", [
                    'contents' => [['parts' => [['text' => $prompt]]]]
                ]);

            if ($response->failed()) {
                Log::error('Gemini API request failed.', [
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);

                $errorBody = $response->json('error.message', 'Terjadi kesalahan saat berkomunikasi dengan API AI.');
                throw new Exception("Gagal menghubungi AI: " . $errorBody);
            }

            $rawText = $response->json('candidates.0.content.parts.0.text');
            if (is_null($rawText)) {
                Log::warning('Gemini API returned a successful response but with no content.', [
                    'response' => $response->body()
                ]);
                throw new Exception('AI memberikan respons kosong. Coba lagi beberapa saat.');
            }

            $cleanedJsonText = trim(str_replace(['```json', '```'], '', $rawText));
            $analysis = json_decode($cleanedJsonText, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Gemini API returned invalid JSON.', [
                    'raw_text' => $rawText
                ]);
                throw new Exception('AI memberikan format data yang tidak valid.');
            }

            return response()->json($analysis);
        } catch (ConnectionException $e) {
            // Error jika server tidak bisa konek ke Google sama sekali (misal: firewall, DNS)
            Log::critical('Could not connect to Gemini API.', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Tidak dapat terhubung ke server AI. Periksa koneksi internet server atau pengaturan firewall.'], 500);
        } catch (Exception $e) {
            // Menangkap semua error lain yang mungkin terjadi
            return response()->json(['error' => 'Terjadi kesalahan: ' . $e->getMessage()], 500);
        }
    }

    // ... method createCustomerPrompt() tetap sama ...
    private function createCustomerPrompt(string $customerDataJson): string
    {
        // (Tidak ada perubahan pada method ini)
        return <<<PROMPT
Anda adalah seorang analis bisnis perhotelan yang ahli. Berdasarkan data customer dalam format JSON berikut, berikan analisis mendalam.

Data Customer:
{$customerDataJson}

Tugas Anda:
1.  Buat sebuah ringkasan (summary) singkat mengenai profil umum customer dalam 2-3 kalimat.
2.  Identifikasi 3 tren utama (trends) yang paling menonjol dari data tersebut (misalnya, negara asal paling umum, hari check-in favorit, dll.).
3.  Berikan 3 rekomendasi (recommendations) actionable yang bisa dilakukan oleh manajemen hotel untuk meningkatkan bisnis berdasarkan tren tersebut.

Format respons Anda HARUS dan HANYA dalam bentuk JSON yang valid dengan struktur berikut:
{
  "summary": "Teks ringkasan Anda di sini.",
  "trends": [
    "Poin tren pertama.",
    "Poin tren kedua.",
    "Poin tren ketiga."
  ],
  "recommendations": [
    "Poin rekomendasi pertama.",
    "Poin rekomendasi kedua.",
    "Poin rekomendasi ketiga."
  ]
}
PROMPT;
    }
}
