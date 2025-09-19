<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ServiceController;

// Rute untuk mendapatkan detail satu layanan
Route::get('/services/{service}', [ServiceController::class, 'show']);

// Rute untuk membuat order dari bot Telegram (n8n)
Route::post('/orders/create-from-bot', [OrderController::class, 'createFromBot']);
