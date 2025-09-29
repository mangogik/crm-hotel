<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Reminder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
// use App\Events\ReminderNotification; // Dinonaktifkan sementara

class SendScheduledReminders extends Command
{
    /**
     * Nama dan signature dari console command.
     */
    protected $signature = 'app:send-scheduled-reminders';

    /**
     * Deskripsi dari console command.
     */
    protected $description = 'Check for due reminders and process them by triggering an n8n webhook';

    /**
     * Method utama yang akan dieksekusi saat command dijalankan.
     */
    public function handle()
    {
        $this->info('Checking for scheduled reminders...');

        // Memuat relasi yang dibutuhkan agar data lengkap saat dikirim
        $remindersToSend = Reminder::with(['booking.customer', 'booking.room', 'order.customer'])
                                     ->where('status', 'pending')
                                     ->where('scheduled_at', '<=', now())
                                     ->get();

        if ($remindersToSend->isEmpty()) {
            $this->info('No reminders to send at this time.');
            return 0;
        }

        $this->info($remindersToSend->count() . ' reminder(s) found. Processing...');

        foreach ($remindersToSend as $reminder) {
            
            // Siapkan data payload untuk n8n
            $payload = $this->buildPayload($reminder);
            if (is_null($payload)) {
                Log::warning('Reminder skipped due to missing critical data.', ['reminder_id' => $reminder->id]);
                $reminder->update(['status' => 'cancelled']);
                continue;
            }

            try {
                // broadcast(new ReminderNotification($payload['message'])); // Logika Reverb dinonaktifkan
                
                // Ganti dengan URL webhook n8n Anda yang sesuai
                $webhookUrl = 'https://otomations.kumtura.me/webhook-test/reminder-notification';
                
                Http::post($webhookUrl, $payload);

                // Update status reminder menjadi 'sent'
                $reminder->update(['status' => 'sent', 'sent_at' => now()]);
                
                $this->info("Reminder ID: {$reminder->id} sent to n8n successfully.");
                Log::info("Reminder ID: {$reminder->id} sent to n8n successfully.");

            } catch (\Exception $e) {
                $this->error("Failed to send reminder ID: {$reminder->id}. Error: " . $e->getMessage());
                Log::error("Failed to send reminder ID: {$reminder->id}", ['error' => $e->getMessage()]);
            }
        }

        $this->info('All reminders have been processed.');
        return 0;
    }

    /**
     * Membangun payload data yang akan dikirim ke n8n.
     */
    private function buildPayload(Reminder $reminder): ?array
    {
        $type = $reminder->reminder_type;
        $customer = null;

        if ($reminder->target_type === 'booking' && $reminder->booking?->customer) {
            $customer = $reminder->booking->customer;
        } elseif ($reminder->target_type === 'order' && $reminder->order?->customer) {
            $customer = $reminder->order->customer;
        }

        if (!$customer) {
            return null; // Tidak bisa mengirim jika tidak ada data customer
        }

        return [
            'reminder_type' => $type,
            'customer_name' => $customer->name,
            'chat_id' => $customer->phone, // Asumsi chat_id disimpan di kolom phone
            'target_id' => $reminder->target_id,
        ];
    }
}
