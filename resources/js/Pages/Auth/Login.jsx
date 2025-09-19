import { useEffect } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Hotel, Loader2, Mail, Lock } from "lucide-react";

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset("password");
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route("login"));
    };

    return (
        <>
            <Head title="Login" />
            <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
                {/* Left Panel */}
                <div className="flex items-center justify-center px-6">
                    <div className="w-full max-w-md space-y-6 py-16">
                        {/* Header */}
                        <div className="text-center space-y-3">
                            <div className="flex justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-slate-200 rounded-full blur-xl opacity-20 animate-pulse"></div>
                                    <div className="relative bg-white p-3 rounded-full shadow">
                                        <Hotel className="h-7 w-7 text-slate-700" />
                                    </div>
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">Selamat Datang</h1>
                            <p className="text-slate-600 text-sm">Masuk ke dashboard hotel Anda</p>
                        </div>

                        {/* Status */}
                        {status && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                <p className="text-green-800 text-sm">{status}</p>
                            </div>
                        )}

                        {/* Form Card */}
                        <div className="bg-white rounded-2xl shadow p-6 space-y-5">
                            <form onSubmit={submit} className="space-y-4">
                                {/* Email */}
                                <div className="space-y-1">
                                    <Label htmlFor="email" className="flex items-center space-x-2 text-slate-700 font-medium">
                                        <Mail className="h-4 w-4 text-slate-700" />
                                        <span>Email Address</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        autoComplete="username"
                                        autoFocus
                                        placeholder="nama@email.com"
                                        onChange={(e) => setData("email", e.target.value)}
                                        className="h-10 rounded-lg border-slate-200 focus:border-slate-600 focus:ring-slate-100"
                                    />
                                    {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                                </div>

                                {/* Password */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="flex items-center space-x-2 text-slate-700 font-medium">
                                            <Lock className="h-4 w-4 text-slate-700" />
                                            <span>Password</span>
                                        </Label>
                                        {canResetPassword && (
                                            <Link
                                                href={route("password.request")}
                                                className="text-slate-600 hover:text-slate-900 text-sm"
                                            >
                                                Lupa password?
                                            </Link>
                                        )}
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        autoComplete="current-password"
                                        placeholder="Masukkan password Anda"
                                        onChange={(e) => setData("password", e.target.value)}
                                        className="h-10 rounded-lg border-slate-200 focus:border-slate-600 focus:ring-slate-100"
                                    />
                                    {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
                                </div>

                                {/* Remember Me */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        checked={data.remember}
                                        onCheckedChange={(checked) => setData("remember", checked)}
                                        className="rounded border-slate-300 data-[state=checked]:bg-slate-700 data-[state=checked]:border-slate-700"
                                    />
                                    <Label htmlFor="remember" className="text-slate-600 cursor-pointer select-none">
                                        Ingat saya
                                    </Label>
                                </div>

                                {/* Submit */}
                                <Button
                                    type="submit"
                                    className="w-full h-10 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Memproses...</span>
                                        </div>
                                    ) : (
                                        "Masuk ke Dashboard"
                                    )}
                                </Button>
                            </form>

                            {/* Register */}
                            <p className="text-center text-slate-500 text-sm">
                                Belum memiliki akun?{" "}
                                <Link href={route("register")} className="text-slate-800 font-medium hover:text-slate-900">
                                    Daftar sekarang
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Image */}
                <div className="hidden lg:block relative">
                    <img
                        src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=1932&auto=format&fit=crop"
                        alt="Hotel lobby"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
            </div>
        </>
    );
}
