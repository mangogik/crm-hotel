<?php

namespace App\Http\Controllers;

use App\Models\ServiceCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule; // <-- Import Rule
use Illuminate\Support\Facades\Log; // <-- Import Log

class ServiceCategoryController extends Controller
{
    // Method index() Anda di sini tidak diperlukan
    // karena ServiceController@index sudah mengambil kategori
    // dan mengirimkannya ke 'Services.vue'

    public function store(Request $request)
    {
        // Validasi slug sekarang bisa opsional dan akan dicek unik
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('service_categories')],
            'slug' => ['nullable', 'string', 'max:100', Rule::unique('service_categories')],
            'description' => ['nullable', 'string'],
        ]);

        try {
            // Slug akan dibuat otomatis oleh Model jika tidak diisi
            ServiceCategory::create($validated);
            return redirect()->back()->with('success', 'Service category created successfully.');
        } catch (\Exception $e) {
            Log::error('Category creation failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to create category.');
        }
    }

    public function update(Request $request, ServiceCategory $serviceCategory)
    {
        $validated = $request->validate([
            'name' => [
                'required', 
                'string', 
                'max:100', 
                Rule::unique('service_categories')->ignore($serviceCategory->id)
            ],
            'slug' => [
                'nullable', 
                'string', 
                'max:100', 
                Rule::unique('service_categories')->ignore($serviceCategory->id)
            ],
            'description' => ['nullable', 'string'],
        ]);

        try {
            // Slug akan diperbarui otomatis oleh Model jika nama berubah
            // dan slug tidak diisi manual
            $serviceCategory->update($validated);
            return redirect()->back()->with('success', 'Service category updated successfully.');
        } catch (\Exception $e) {
            Log::error('Category update failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update category.');
        }
    }

    public function destroy(ServiceCategory $serviceCategory)
    {
        try {
            // Database constraint "ON DELETE SET NULL" akan menangani
            // update service yang terkait secara otomatis.
            $serviceCategory->delete();
            return redirect()->back()->with('success', 'Service category deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Category deletion failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete category.');
        }
    }
}
