<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);


        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
            'n8n' => \App\Http\Middleware\AuthenticateN8nWebhook::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'api/orders/create-from-bot', 
            'api/reviews/create-from-bot', 
            'api/interactions'
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
