<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;

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

/*
|--------------------------------------------------------------------------
| Rute API / Bot (tanpa CSRF)
|--------------------------------------------------------------------------
*/
Route::middleware(['web'])->group(function () {
    // Rute untuk mendapatkan detail satu layanan
    // Route::get('/services/{service}', [ServiceController::class, 'show']);

    // Rute untuk membuat order dari bot Telegram (n8n)

    Route::prefix('api')->middleware('n8n')->group(function () {
        Route::post('/orders/create-from-bot', [OrderController::class, 'createFromBot']);
    });
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

    // --- HANYA BISA DIAKSES MANAGER ---
    Route::middleware(['role:manager'])->group(function () {
        Route::get('/history', function () {
            return Inertia::render('History');
        })->name('history');
    });

    // --- HANYA BISA DIAKSES FRONT OFFICE ---
    Route::middleware(['role:front-office'])->group(function () {
        Route::resource('customers', CustomerController::class);
        Route::resource('services', ServiceController::class);
        Route::resource('orders', OrderController::class);
    });

    // --- BISA DIAKSES MANAGER & FRONT OFFICE ---
    Route::middleware(['role:manager,front-office'])->group(function () {
        // Route::get('/dashboard', function () {
        //     return Inertia::render('Home');
        // })->name('dashboard');
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
        // Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    });
});

// Memuat rute otentikasi (login, register, dll) dari Breeze
require __DIR__ . '/auth.php';
