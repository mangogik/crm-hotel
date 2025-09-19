<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Enums\UserRole; // <-- Impor Enum

class UserSeeder extends Seeder
{
    public function run()
    {
        User::create([
            'name' => 'Manager Account',
            'email' => 'manager@hotel.com',
            'password' => Hash::make('password'),
            'role' => UserRole::Manager,
        ]);

        User::create([
            'name' => 'Front Office Desk',
            'email' => 'frontoffice@hotel.com',
            'password' => Hash::make('password'),
            'role' => UserRole::FrontOffice,
        ]);
    }
}