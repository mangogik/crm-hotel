<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class AuthController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        // validasi input
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $email = $request->input('email');
        $password = $request->input('password');

        // Logging login attempt
        Log::info('Login attempt', ['email' => $email, 'exists' => (bool)User::where('email', $email)->exists()]);

        // cari user berdasarkan email
        $user = User::where('email', $email)->first();

        if (! $user) {
            // jangan tunjukkan perbedaan antara "user tidak ada" dan "password salah" pada Production,
            // tapi untuk dev kita beri pesan yang jelas:
            return back()->withErrors(['email' => 'Email atau password salah.'])->withInput();
        }

        // cek password terenkripsi
        if (! Hash::check($password, $user->password)) {
            Log::warning("Login failed for email: {$email}");
            return back()->withErrors(['email' => 'Email atau password salah.'])->withInput();
        }

        // jika benar, login user
        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended('/dashboard');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
