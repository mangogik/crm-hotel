<?php

use App\Http\Controllers\AIController;
use App\Http\Controllers\InteractionController;
use App\Http\Controllers\BookingController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\RoomTypeController;
use App\Http\Controllers\SettingController;

// !!! PENTING: Menambahkan 'use Mail' untuk rute tes !!!
use Illuminate\Support\Facades\Mail;

/*
|--------------------------------------------------------------------------
| Rute Publik
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/check-ai-models', [AIController::class, 'listModels']);

// =====================================================================
// == RUTE TES EMAIL ==
// =====================================================================
Route::get('/test-email-server/{email}', function ($email) {
    try {
        // Kita akan membangun pesan teksnya di sini
        $pesan = "Halo!\n\n"
            . "Ini adalah email tes otomatis dari aplikasi Anda.\n\n"
            . "=============================================\n"
            . "   KONEKSI SMTP BERHASIL DIKONFIGURASI   \n"
            . "=============================================\n\n"
            . "Jika Anda menerima email ini, itu berarti gg gaming:\n"
            . "Penerima Tes: " . $email . "\n"
            . "Waktu Tes: " . now()->toDateTimeString() . " (Waktu Server)\n\n"
            . "Salam,\n"
            . "Developer Yogix Gahol mantap gacor anjay";

        Mail::raw($pesan, function ($message) use ($email) {
            $message->to($email)
                ->subject('✅ [TES BERHASIL] - Email terkirim!');
        });

        return 'Sukses! Email tes yang lebih menarik telah dikirim ke ' . $email;
    } catch (\Exception $e) {
        return 'Gagal: ' . $e->getMessage();
    }
});
// =====================================================================


/*
|--------------------------------------------------------------------------
| Rute API / Bot (tanpa CSRF)
|--------------------------------------------------------------------------
*/
Route::prefix('api')->middleware('n8n')->group(function () {
    Route::post('/orders/create-from-bot', [OrderController::class, 'createFromBot']);
    Route::post('/reviews/create-from-bot', [ReviewController::class, 'storeFromBot']);
    Route::post('/interactions', [InteractionController::class, 'store']);
    Route::get('/booking/active-by-phone/{phone}', [BookingController::class, 'getActiveBookingByPhone']);
});


/*
|--------------------------------------------------------------------------
| Rute Terproteksi
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {

    // Rute profil bawaan Breeze
    Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [\App\Http\Controllers\ProfileController::class, 'destroy'])->name('profile.destroy');

    // --- Grup untuk API internal yang memerlukan otentikasi session ---
    Route::prefix('api')->group(function () {
        Route::get('/bookings/check-availability', [BookingController::class, 'checkAvailability'])->name('bookings.checkAvailability');
        Route::get('/customers/{customer}/bookings', [BookingController::class, 'byCustomer'])->name('customers.bookings');
        Route::get('/promotions/check', [PromotionController::class, 'checkEligibility'])->name('promotions.check');
        Route::post('/promotions/check-eligibility', [PromotionController::class, 'checkEligibility'])->name('promotions.checkEligibility');
        Route::get('/services/{service}/questions', [ServiceController::class, 'getQuestions']);
        Route::get('/services/{service}/images', [ServiceController::class, 'getImages'])
            ->name('services.images');
    });

    // --- HANYA BISA DIAKSES MANAGER ---
    Route::middleware(['role:manager'])->group(function () {
        // Route::get('/history', function () {
        //     return Inertia::render('Reports');
        // })->name('history');
    });

    // --- HANYA BISA DIAKSES FRONT OFFICE ---
    Route::middleware(['role:front-office'])->group(function () {
        Route::resource('customers', CustomerController::class);
        Route::resource('services', ServiceController::class);
        Route::resource('orders', OrderController::class);
        Route::resource('bookings', BookingController::class);
        Route::resource('rooms', RoomController::class);
        Route::resource('payments', PaymentController::class);
        Route::resource('promotions', PromotionController::class);
    });

    // --- BISA DIAKSES MANAGER & FRONT OFFICE ---
    Route::middleware(['role:manager,front-office'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::post('/room-types', [RoomTypeController::class, 'store'])->name('room-types.store');
        Route::put('/room-types/{roomType}', [RoomTypeController::class, 'update'])->name('room-types.update');
        Route::delete('/room-types/{roomType}', [RoomTypeController::class, 'destroy'])->name('room-types.destroy');
        Route::resource('reports', ReportController::class);
        Route::resource('reviews', ReviewController::class);
        Route::get('/ai/analytics', [AIController::class, 'showPage'])->name('ai.analytics.show');
        Route::post('/ai/generate-analysis', [AIController::class, 'generateAnalysis'])->name('ai.analytics.generate');
        Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');
        Route::post('/settings', [SettingController::class, 'update'])->name('settings.update');
    });
});

// Memuat rute otentikasi (login, register, dll) dari Breeze
require __DIR__ . '/auth.php';
