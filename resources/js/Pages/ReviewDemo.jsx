import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Star, CheckCircle, MessageSquare, Hotel, Award, User, Quote } from "lucide-react";
import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * Komponen Inti Demo Widget Rating
 */
function ReviewWidgetDemoCard({ site }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const hotelName = site.name || "Hotel Luxuria";
    const hotelLogo = site.logo || null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsAnimating(true);
        
        // Simulasi loading
        setTimeout(() => {
            setSubmitted(true);
            setIsAnimating(false);
        }, 1000);
    };

    // Tampilan setelah submit
    if (submitted) {
        return (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-md w-full">
                <div className="p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-20"></div>
                            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center relative z-10">
                                <CheckCircle className="w-8 h-8 text-amber-600" />
                            </div>
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Terima Kasih!</h3>
                    <p className="text-gray-600 mb-6">
                        Review Anda telah kami terima dan sangat berarti bagi {hotelName}.
                    </p>
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center bg-amber-50 px-4 py-2 rounded-full">
                            <span className="text-amber-800 font-medium mr-2">Rating Anda:</span>
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
                                ))}
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={() => {
                            setSubmitted(false);
                            setRating(0);
                            setComment("");
                        }}
                        className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white border-0 w-full"
                    >
                        Beri Review Lagi
                    </Button>
                </div>
            </div>
        );
    }

    // Tampilan form rating
    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-md w-full">
            <div className="p-8">
                <div className="text-center mb-8">
                    {hotelLogo ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 border-2 border-amber-100">
                            <img 
                                src={hotelLogo} 
                                alt={hotelName} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 flex items-center justify-center mx-auto mb-4">
                            <Hotel className="w-8 h-8 text-white" />
                        </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Bagaimana Pengalaman Anda?</h3>
                    <p className="text-gray-600">Beri kami rating untuk layanan {hotelName}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Bintang Interaktif */}
                    <div>
                        <Label className="text-gray-700 font-medium">Rating Anda</Label>
                        <div className="flex items-center justify-center gap-1 py-4">
                            {[1, 2, 3, 4, 5].map((starValue) => (
                                <Star
                                    key={starValue}
                                    className={`w-10 h-10 cursor-pointer transition-all duration-200 ${
                                        (hoverRating || rating) >= starValue
                                            ? "text-amber-500 fill-amber-500 scale-110"
                                            : "text-gray-300"
                                    }`}
                                    onClick={() => setRating(starValue)}
                                    onMouseOver={() => setHoverRating(starValue)}
                                    onMouseLeave={() => setHoverRating(0)}
                                />
                            ))}
                        </div>
                        <div className="text-center text-sm text-gray-500 mt-1">
                            {rating > 0 && (
                                <span>
                                    {rating === 1 && "Sangat Buruk"}
                                    {rating === 2 && "Buruk"}
                                    {rating === 3 && "Cukup Baik"}
                                    {rating === 4 && "Baik"}
                                    {rating === 5 && "Sangat Baik"}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Komentar */}
                    <div>
                        <Label htmlFor="comment" className="text-gray-700 font-medium">Komentar (Opsional)</Label>
                        <Textarea
                            id="comment"
                            placeholder="Ceritakan lebih lanjut tentang pengalaman Anda..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px] resize-none border-gray-300 focus:border-amber-500 focus:ring-amber-500 mt-2"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={rating === 0 || isAnimating}
                        className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white border-0 flex items-center justify-center py-3"
                    >
                        {isAnimating ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Memproses...
                            </>
                        ) : (
                            <>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Kirim Review
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}

/**
 * Halaman Utama Wrapper
 */
export default function ReviewDemo(props) {
    const site = props.site || {};
    const hotelName = site.name || "Hotel Luxuria";
    const hotelTagline = site.tagline || "The Definition of Luxury";
    const hotelLogo = site.logo || null;

    return (
        <>
            <Head title="Review Hotel" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header dengan branding hotel */}
                    <div className="text-center mb-16">
                        {hotelLogo ? (
                            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-6 border-4 border-white shadow-lg">
                                <img 
                                    src={hotelLogo} 
                                    alt={hotelName} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <Hotel className="w-10 h-10 text-white" />
                            </div>
                        )}
                        <h1 className="text-4xl font-bold text-gray-900 mb-3">{hotelName}</h1>
                        <p className="text-xl text-gray-600 mb-8">{hotelTagline}</p>
                        
                        <div className="inline-flex items-center bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
                            <Award className="w-5 h-5 text-amber-500 mr-2" />
                            <span className="text-gray-700">Terima kasih telah memilih {hotelName}</span>
                        </div>
                    </div>

                    {/* Konten utama */}
                    <div className="flex flex-col items-center">
                        <div className="mb-12 text-center max-w-2xl">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Bagikan Pengalaman Anda</h2>
                            <p className="text-lg text-gray-600">
                                Umpan balik Anda sangat berarti bagi kami. Silakan berikan rating dan komentar tentang pengalaman menginap Anda di {hotelName}.
                            </p>
                        </div>

                        {/* Komponen Widget di tengah */}
                        <div className="mb-16">
                            <ReviewWidgetDemoCard site={site} />
                        </div>

                        {/* Informasi tambahan */}
                        <div className="w-full">
                            <div className="text-center mb-10">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Mengapa Review Anda Penting?</h3>
                                <p className="text-gray-600 max-w-2xl mx-auto">
                                    Setiap review yang Anda berikan membantu kami meningkatkan kualitas layanan dan pengalaman menginap untuk tamu lainnya.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                                    <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Star className="w-7 h-7 text-amber-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Rating Jujur</h3>
                                    <p className="text-gray-600">Kami menghargai umpan balik jujur untuk meningkatkan layanan kami</p>
                                </div>
                                
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                                    <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="w-7 h-7 text-amber-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Komentar Pribadi</h3>
                                    <p className="text-gray-600">Setiap komentar akan dibaca secara pribadi oleh manajemen hotel</p>
                                </div>
                                
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                                    <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-7 h-7 text-amber-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Terima Kasih</h3>
                                    <p className="text-gray-600">Kami mengucapkan terima kasih atas waktu dan umpan balik Anda</p>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial Preview */}
                        <div className="mt-16 w-full max-w-3xl mx-auto">
                            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-8 border border-amber-100">
                                <div className="flex items-start">
                                    <div className="bg-white p-3 rounded-full mr-4">
                                        <Quote className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-gray-700 italic mb-4">
                                            "Pelayanan di {hotelName} luar biasa! Staf sangat ramah dan fasilitasnya sangat bersih. Saya pasti akan kembali lagi."
                                        </p>
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                                <User className="w-5 h-5 text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Ahmad Wijaya</p>
                                                <div className="flex text-amber-400">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className="w-4 h-4 fill-current" />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// Membungkus halaman dengan layout dashboard
ReviewDemo.layout = (page) => <AuthenticatedLayout>{page}</AuthenticatedLayout>;