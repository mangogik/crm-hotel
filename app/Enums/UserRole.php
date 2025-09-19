<?php

namespace App\Enums;

// Enum ini memiliki "backing" string, artinya setiap case memiliki nilai string
enum UserRole: string
{
    case Manager = 'manager';
    case FrontOffice = 'front-office';
}