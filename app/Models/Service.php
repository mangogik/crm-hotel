<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Service extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'type',
        'fulfillment_type',
        'offering_session',
        'unit_name',
        'options',
        'membership_discount'
    ];

    protected $casts = [
        'options' => 'array',
        'membership_discount' => 'array'
    ];

    public function orders()
    {
        return $this->belongsToMany(Order::class, 'order_service')
            ->withPivot(['quantity', 'price_per_unit', 'details'])
            ->withTimestamps();
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($m) {
            if (empty($m->slug) && !empty($m->name)) {
                $m->slug = static::uniqueSlug($m->name);
            }
        });

        static::updating(function ($m) {
            if ($m->isDirty('name')) {
                $m->slug = static::uniqueSlug($m->name, $m->id);
            }
        });
    }

    protected static function uniqueSlug(string $name, $ignoreId = null): string
    {
        $base = Str::slug($name ?: 'service');
        $slug = $base;
        $i = 2;

        $query = static::query();
        if ($ignoreId) $query->where('id', '!=', $ignoreId);

        while ($query->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }

    public function promotions()
    {
        return $this->belongsToMany(Promotion::class, 'promotion_services');
    }

    public function serviceQuestions()
    {
        return $this->hasMany(ServiceQuestion::class);
    }

    public function images()
    {
        return $this->hasMany(ServiceImage::class);
    }

    public function optionImages()
    {
        return $this->hasMany(ServiceOptionImage::class);
    }

    public function activeQuestion()
    {
        return $this->hasOne(ServiceQuestion::class)->where('is_active', true);
    }

    public function getActiveQuestionsAttribute()
    {
        $activeQuestion = $this->activeQuestion;
        return $activeQuestion ? $activeQuestion->questions_json : [];
    }

    public function isMultipleOptions(): bool
    {
        return $this->type === 'multiple_options';
    }
}
