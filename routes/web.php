<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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
| Rute Terproteksi
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {

    // Rute profil bawaan Breeze
    Route::get('/profile', [\App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [\App\Http\Controllers\ProfileController::class, 'destroy'])->name('profile.destroy');

    // --- HANYA BISA DIAKSES MANAGER ---
    Route::middleware(['role:manager'])->group(function () {});

    // --- BISA DIAKSES MANAGER & FRONT OFFICE ---
    Route::middleware(['role:manager,front-office'])->group(function () {
        Route::get('/dashboard', function () {
            return Inertia::render('Home');
        })->name('dashboard');
        Route::get('/customers', function () {
            return Inertia::render('Customers');
        })->name('customers');

        Route::get('/services', function () {
            return Inertia::render('Services');
        })->name('services');

        Route::get('/orders', function () {
            return Inertia::render('Orders');
        })->name('orders');
    });
});

// Memuat rute otentikasi (login, register, dll) dari Breeze
require __DIR__ . '/auth.php';
