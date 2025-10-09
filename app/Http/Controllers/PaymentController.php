<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Menampilkan daftar pembayaran dengan filter, sorting, dan paginasi.
     */
    public function index(Request $request)
    {
        $perPage       = (int)($request->input('per_page', 10));
        $search        = trim((string)$request->input('search', ''));
        $status        = $request->input('status', '');
        $method        = $request->input('method', '');
        $gateway       = $request->input('gateway', '');
        $dateFrom      = $request->input('date_from', '');
        $dateTo        = $request->input('date_to', '');
        $sortBy        = $request->input('sort_by', 'created_at');
        $sortDirection = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = Payment::query()
            ->with([
                'order:id,customer_id,status,payment_preference,created_at',
                'order.customer:id,name,email,phone,passport_country',
            ]);

        // Terapkan filter
        $this->applyFilters($query, compact('search', 'status', 'method', 'gateway', 'dateFrom', 'dateTo'));

        // Hitung total untuk kartu statistik (sebelum paginasi)
        $totals = $this->calculateTotals(clone $query);

        // Terapkan sorting
        $this->applySorting($query, $sortBy, $sortDirection);

        $payments = $query->paginate($perPage)->withQueryString();

        // Ambil daftar gateway unik untuk filter dropdown
        $gateways = Payment::query()->select('gateway')->whereNotNull('gateway')->distinct()->pluck('gateway')->filter()->values();

        return Inertia::render('Payments', [
            'payments' => $payments,
            'filters'  => $request->only(['search', 'status', 'method', 'gateway', 'date_from', 'date_to', 'per_page', 'sort_by', 'sort_direction']),
            'totals'   => $totals,
            'gateways' => $gateways,
            'flash'    => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Membuat entri pembayaran baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
            'amount'   => ['required', 'numeric', 'min:0'],
            'method'   => ['required', Rule::in(['cash', 'online'])],
            'gateway'  => ['nullable', 'string', 'max:50'],
            'notes'    => ['nullable', 'string'],
        ]);

        $status = $validated['method'] === 'cash' ? 'paid' : 'pending';

        $payload = [
            'order_id' => $validated['order_id'],
            'amount'   => $validated['amount'],
            'method'   => $validated['method'],
            'currency' => 'IDR',
            'status'   => $status,
            'gateway'  => $validated['gateway'] ?? ($validated['method'] === 'online' ? 'xendit' : 'manual'),
            'notes'    => $validated['notes'] ?? null,
            'paid_at'  => $status === 'paid' ? now() : null,
        ];

        // Stub untuk integrasi payment gateway
        if ($validated['method'] === 'online') {
            $payload['external_id'] = 'ORD-' . $validated['order_id'] . '-' . now()->timestamp;
            // $payload['payment_url'] = ... (diisi dari response Xendit nanti)
        }

        Payment::create($payload);

        return back()->with('success', 'Payment created successfully.');
    }

    /**
     * Memperbarui status pembayaran (Mark as Paid, Failed, Refunded).
     */
    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'method' => ['required', Rule::in(['cash', 'online'])],
            'status' => ['required', Rule::in(['pending', 'paid', 'failed', 'refunded'])],
            'notes'  => ['nullable', 'string'],
        ]);

        // Hanya update 3 field yang diizinkan
        $payment->method = $validated['method'];
        $payment->status = $validated['status'];

        // Atur paid_at hanya berdasar status
        if ($validated['status'] === 'paid') {
            $payment->paid_at = $payment->paid_at ?: now();
        } else {
            // Kalau mau paid_at dikosongkan saat bukan "paid", aktifkan baris di bawah:
            // $payment->paid_at = null;
        }

        $payment->save();

        return back()->with('success', 'Payment updated.');
    }


    /**
     * Menghapus data pembayaran.
     */
    public function destroy(Payment $payment)
    {
        $payment->delete();
        return back()->with('success', 'Payment deleted successfully.');
    }

    // --- Helper Methods ---

    private function applyFilters($query, array $filters)
    {
        extract($filters);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('external_id', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhereHas('order.customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        if ($status && $status !== 'all') $query->where('status', $status);
        if ($method && $method !== 'all') $query->where('method', $method);
        if ($gateway && $gateway !== 'all') $query->where('gateway', $gateway);
        if ($dateFrom) $query->whereDate('created_at', '>=', $dateFrom);
        if ($dateTo) $query->whereDate('created_at', '<=', $dateTo);
    }

    private function applySorting($query, $sortBy, $sortDirection)
    {
        // Khusus untuk sorting berdasarkan nama customer
        if ($sortBy === 'order.customer.name') {
            $query->select('payments.*') // Hindari konflik nama kolom
                ->leftJoin('orders', 'payments.order_id', '=', 'orders.id')
                ->leftJoin('customers', 'orders.customer_id', '=', 'customers.id')
                ->orderBy('customers.name', $sortDirection);
        } else {
            // Sorting untuk kolom di tabel payments
            $sortable = ['created_at', 'paid_at', 'amount', 'status', 'method', 'gateway'];
            if (in_array($sortBy, $sortable)) {
                $query->orderBy($sortBy, $sortDirection);
            }
        }
    }

    private function calculateTotals($query): array
    {
        return [
            'paid'     => $query->clone()->where('status', 'paid')->sum('amount'),
            'pending'  => $query->clone()->where('status', 'pending')->sum('amount'),
            'failed'   => $query->clone()->where('status', 'failed')->sum('amount'),
            'refunded' => $query->clone()->where('status', 'refunded')->sum('amount'),
        ];
    }
}
