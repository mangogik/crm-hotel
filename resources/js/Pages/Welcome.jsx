// resources/js/Pages/Welcome.jsx

import { Head, Link } from '@inertiajs/react';
import { buttonVariants } from '@/components/ui/button';
import { Hotel, ArrowRight } from 'lucide-react';

export default function Welcome({ auth }) {
    const backgroundImageUrl = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop';

    return (
        <>
            <Head title="Welcome to Tohjaya Hotel CRM" />

            {/* 1. Buat container utama yang relative untuk menampung layer */}
            <div className="relative min-h-screen overflow-hidden text-white">
                {/* 2. Layer untuk Background Image yang di-blur */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center blur-sm" // <-- INI KELAS UTAMA UNTUK EFEK BLUR
                    style={{ backgroundImage: `url(${backgroundImageUrl})` }}
                />
                
                {/* 3. Layer untuk Overlay Gelap */}
                <div className="absolute inset-0 z-10 bg-black/60" />

                {/* 4. Layer untuk Konten, pastikan z-index lebih tinggi */}
                <div className="relative z-20 flex min-h-screen flex-col">
                    <header className="container mx-auto flex items-center justify-between px-6 py-4">
                        <Link href="/" className="flex items-center gap-2">
                            <Hotel className="h-7 w-7 text-white" />
                            <span className="text-xl font-bold tracking-tight text-white">
                                CRM Hotel
                            </span>
                        </Link>

                        <nav className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className={buttonVariants({ variant: 'outline', className: 'border-white/50 text-white hover:bg-white/10 hover:border-white' })}
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className={buttonVariants({ variant: 'ghost', className: 'text-white hover:bg-white/10' })}
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className={buttonVariants({ className: 'bg-white text-slate-900 hover:bg-white/90' })}
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>

                    <main className="flex flex-1 flex-col items-center justify-center text-center px-6">
                        <div className="max-w-4xl">
                            <h1 className="text-5xl font-extrabold leading-tight tracking-tighter text-white sm:text-6xl md:text-7xl lg:text-8xl drop-shadow-lg">
                                Kelola Hotel Anda dengan Cerdas
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90 leading-relaxed md:text-xl">
                                Sistem Manajemen Relasi Pelanggan terdepan untuk
                                mengoptimalkan operasional dan meningkatkan
                                kepuasan tamu hotel Tohjaya.
                            </p>
                            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className={buttonVariants({ size: 'lg', className: 'bg-white text-slate-900 hover:bg-white/90 transition-all duration-300 transform hover:-translate-y-1' })}
                                    >
                                        Lanjutkan ke Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className={buttonVariants({ size: 'lg', className: 'bg-white text-slate-900 hover:bg-white/90 transition-all duration-300 transform hover:-translate-y-1' })}
                                        >
                                            Mulai Sekarang <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className={buttonVariants({ variant: 'outline', size: 'lg', className: 'border-white/50 text-white hover:bg-white/10 hover:border-white transition-all duration-300 transform hover:-translate-y-1' })}
                                        >
                                            Pelajari Lebih Lanjut
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </main>

                    <footer className="py-6 text-center text-sm text-white/60">
                        <div className="container px-6">
                            &copy; {new Date().getFullYear()} Tohjaya Company. All Rights Reserved.
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}