<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateN8nWebhook
{
    public function handle(Request $request, Closure $next): Response
    {
        $expectedToken = config('services.n8n.token'); // dari .env
        $providedToken = $request->bearerToken();

        if (!$expectedToken || !$providedToken || $providedToken !== $expectedToken) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        return $next($request);
    }
}
