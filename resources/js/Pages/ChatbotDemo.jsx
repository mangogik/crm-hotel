import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Bot, X, Send, MessageCircle, User, Bot as BotIcon, Clock, Wifi, Car, Utensils, Coffee, Waves, Dumbbell, ExternalLink } from "lucide-react";
import { useState, useEffect, useRef } from "react";

// Komponen untuk menampilkan link dalam chat (tidak bisa diklik tapi terlihat bisa diklik)
const ChatLink = ({ children }) => {
    return (
        <span className="inline-flex items-center text-amber-600 font-medium cursor-pointer hover:text-amber-700 hover:underline transition-colors">
            {children}
            <ExternalLink className="w-3 h-3 ml-1" />
        </span>
    );
};

// Komponen untuk merender konten chat yang mungkin mengandung link
const ChatContent = ({ content }) => {
    if (Array.isArray(content)) {
        return (
            <p className="text-sm">
                {content.map((item, index) => (
                    <span key={index}>
                        {item}
                    </span>
                ))}
            </p>
        );
    }
    return <p className="text-sm">{content}</p>;
};

// Komponen Floating Button dan Chat Popup
function ChatbotFloater({ site }) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [history, setHistory] = useState([
        { 
            role: "bot", 
            content: `Selamat datang di ${site.name || "Hotel Luxuria"}! Saya adalah asisten virtual Anda. Ada yang bisa saya bantu hari ini?` 
        },
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto scroll ke bottom saat ada pesan baru
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const handleSend = (msg = null) => {
        const messageToSend = msg || message;
        if (!messageToSend.trim()) return;

        // Tambahkan pesan user
        const newUserMessage = { role: "user", content: messageToSend };
        setHistory(prev => [...prev, newUserMessage]);
        setMessage("");
        
        // Tampilkan indikator typing
        setIsTyping(true);
        
        // Simulasi delay respons bot
        setTimeout(() => {
            setIsTyping(false);
            
            // Respons berdasarkan konteks pesan user
            let botResponse = { role: "bot", content: "" };
            const userMessage = messageToSend.toLowerCase();
            const hotelName = site.name || "Hotel Luxuria";
            
            if (userMessage.includes("check-in") || userMessage.includes("cek in")) {
                botResponse.content = `Waktu check-in ${hotelName} dimulai pukul 14.00. Jika Anda tiba lebih awal, kami dapat menyimpan barang Anda di bagian penyimpanan sementara. Apakah Anda sudah melakukan reservasi?`;
            } else if (userMessage.includes("check-out") || userMessage.includes("cek out")) {
                botResponse.content = `Waktu check-out ${hotelName} adalah pukul 12.00. Kami dapat menyediakan check-out ekspres atau perpanjangan waktu jika diperlukan. Ada yang bisa saya bantu lagi?`;
            } else if (userMessage.includes("fasilitas") || userMessage.includes("kolam") || userMessage.includes("gym")) {
                botResponse.content = [
                    `${hotelName} memiliki kolam renang outdoor, pusat kebugaran modern, spa, dan restoran dengan pemandangan kota. Semua fasilitas tersedia untuk tamu hotel tanpa biaya tambahan. Lihat galeri foto fasilitas kami `,
                    <ChatLink key="galeri">di sini</ChatLink>,
                    "."
                ];
            } else if (userMessage.includes("sarapan") || userMessage.includes("makan")) {
                botResponse.content = [
                    `${hotelName} menyajikan sarapan prasmanan setiap hari pukul 06.30-10.30 di restoran lantai dasar. Kami juga memiliki layanan kamar 24 jam untuk menu lainnya. Lihat menu lengkapnya `,
                    <ChatLink key="menu">di sini</ChatLink>,
                    ". Apakah Anda memiliki preferensi diet khusus?"
                ];
            } else if (userMessage.includes("wifi") || userMessage.includes("internet")) {
                botResponse.content = `WiFi gratis tersedia di seluruh area ${hotelName}. Kata sandi WiFi adalah '${hotelName.toUpperCase().replace(/\s/g, "")}2023' dengan kecepatan hingga 100 Mbps. Jika mengalami kendala, silakan hubungi resepsionis.`;
            } else if (userMessage.includes("parkir") || userMessage.includes("mobil")) {
                botResponse.content = `${hotelName} menyediakan parkir valet gratis untuk tamu hotel. Jika Anda membutuhkan sewa mobil atau taksi, kami dapat membantu mengaturnya untuk Anda.`;
            } else if (userMessage.includes("harga") || userMessage.includes("tarif") || userMessage.includes("biaya")) {
                botResponse.content = [
                    `Tarif kamar ${hotelName} bervariasi tergantung tipe kamar dan musim. Untuk informasi tarif terkini atau melakukan reservasi, silakan kunjungi `,
                    <ChatLink key="reservasi">halaman reservasi</ChatLink>,
                    ` atau hubungi bagian reservasi di (021) 1234-5678.`
                ];
            } else if (userMessage.includes("reservasi") || userMessage.includes("booking") || userMessage.includes("pesan")) {
                botResponse.content = [
                    `Anda dapat melakukan reservasi kamar di ${hotelName} melalui `,
                    <ChatLink key="reservasi-online">halaman reservasi online</ChatLink>,
                    `. Kami juga menerima reservasi melalui telepon di (021) 1234-5678 atau email di info@${hotelName.toLowerCase().replace(/\s/g, "")}.com`
                ];
            } else if (userMessage.includes("lokasi") || userMessage.includes("alamat") || userMessage.includes("map")) {
                botResponse.content = [
                    `${hotelName} terletak di Jl. Luxury No. 123, Jakarta Selatan. Lihat peta dan petunjuk arah `,
                    <ChatLink key="lokasi">di sini</ChatLink>,
                    `. Kami juga menyediakan layanan antar-jemput dari bandara dengan biaya tambahan.`
                ];
            } else if (userMessage.includes("galeri") || userMessage.includes("foto")) {
                botResponse.content = [
                    `Lihat galeri foto ${hotelName} `,
                    <ChatLink key="galeri-foto">di sini</ChatLink>,
                    `. Anda dapat melihat foto-foto kamar, restoran, fasilitas, dan pemandangan dari hotel kami.`
                ];
            } else if (userMessage.includes("kontak") || userMessage.includes("hubungi")) {
                botResponse.content = [
                    `Anda dapat menghubungi ${hotelName} melalui: Telepon: (021) 1234-5678, Email: info@${hotelName.toLowerCase().replace(/\s/g, "")}.com, atau kunjungi `,
                    <ChatLink key="kontak">halaman kontak</ChatLink>,
                    ` kami untuk informasi lebih lengkap.`
                ];
            } else {
                botResponse.content = [
                    `Terima kasih atas pertanyaan Anda. Untuk informasi lebih lengkap, silakan hubungi resepsionis ${hotelName} di lobi atau hubungi ekstensi 9 dari kamar Anda. Anda juga dapat melihat informasi umum `,
                    <ChatLink key="faq">di FAQ</ChatLink>,
                    ` kami. Ada yang bisa saya bantu lainnya?`
                ];
            }
            
            setHistory(prev => [...prev, botResponse]);
        }, 1500);
    };

    const handleQuickReply = (text) => {
        handleSend(text);
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 z-50 group"
                    aria-label="Buka Chatbot"
                >
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-700 to-yellow-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                        <div className="relative bg-white p-1 rounded-full">
                            <div className="bg-gradient-to-r from-amber-700 to-yellow-600 p-3 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
                                <MessageCircle className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </button>
            )}

            {/* Chat Popup Window */}
            {isOpen && (
                <div className="fixed bottom-8 right-8 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-amber-100 flex flex-col transition-all duration-300 transform origin-bottom-right">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-700 to-yellow-600 text-white rounded-t-2xl">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-full">
                                <BotIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Asisten {site.name || "Hotel Luxuria"}</h3>
                                <p className="text-xs opacity-80">Online • Siap membantu</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 p-1 rounded-full transition-colors"
                            aria-label="Tutup Chatbot"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Chat History */}
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-amber-50">
                        {history.map((chat, index) => (
                            <div
                                key={index}
                                className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className="flex items-end space-x-2 max-w-[80%]">
                                    {chat.role === "bot" && (
                                        <div className="bg-amber-100 p-1.5 rounded-full">
                                            <BotIcon className="w-4 h-4 text-amber-700" />
                                        </div>
                                    )}
                                    <div
                                        className={`p-3 rounded-2xl ${
                                            chat.role === "user"
                                                ? "bg-gradient-to-r from-amber-600 to-yellow-500 text-white rounded-br-none"
                                                : "bg-white border border-amber-200 text-gray-800 rounded-bl-none shadow-sm"
                                        }`}
                                    >
                                        <ChatContent content={chat.content} />
                                    </div>
                                    {chat.role === "user" && (
                                        <div className="bg-amber-100 p-1.5 rounded-full">
                                            <User className="w-4 h-4 text-amber-700" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="flex items-end space-x-2 max-w-[80%]">
                                    <div className="bg-amber-100 p-1.5 rounded-full">
                                        <BotIcon className="w-4 h-4 text-amber-700" />
                                    </div>
                                    <div className="bg-white border border-amber-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies */}
                    <div className="px-4 py-2 bg-white border-t border-amber-100">
                        <div className="flex flex-wrap gap-2">
                            <button 
                                onClick={() => handleQuickReply("Jam check-in berapa?")}
                                className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 py-1 px-3 rounded-full transition-colors flex items-center"
                            >
                                <Clock className="w-3 h-3 mr-1" /> Check-in
                            </button>
                            <button 
                                onClick={() => handleQuickReply("Fasilitas apa saja yang tersedia?")}
                                className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 py-1 px-3 rounded-full transition-colors flex items-center"
                            >
                                <Waves className="w-3 h-3 mr-1" /> Fasilitas
                            </button>
                            <button 
                                onClick={() => handleQuickReply("Apakah ada parkir?")}
                                className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 py-1 px-3 rounded-full transition-colors flex items-center"
                            >
                                <Car className="w-3 h-3 mr-1" /> Parkir
                            </button>
                            <button 
                                onClick={() => handleQuickReply("Jam sarapan?")}
                                className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 py-1 px-3 rounded-full transition-colors flex items-center"
                            >
                                <Coffee className="w-3 h-3 mr-1" /> Sarapan
                            </button>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-amber-100 rounded-b-2xl">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ketik pesan Anda..."
                                className="flex-1 border border-amber-200 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!message.trim()}
                                className={`p-3 rounded-full flex items-center justify-center ${
                                    message.trim() 
                                        ? 'bg-gradient-to-r from-amber-700 to-yellow-600 text-white hover:shadow-md transition-all' 
                                        : 'bg-amber-100 text-amber-400'
                                }`}
                                aria-label="Kirim"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-amber-600 mt-2 text-center">{site.name || "Hotel Luxuria"} Assistant</p>
                    </div>
                </div>
            )}
        </>
    );
}

// Halaman utama
export default function ChatbotDemo(props) {
    const site = props.site || {};
    const hotelName = site.name || "Hotel Luxuria";

    return (
        <>
            <Head title="Chatbot Demo" />

            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Asisten Virtual {hotelName}</h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Solusi chatbot berbasis AI untuk meningkatkan pengalaman tamu dan efisiensi layanan hotel Anda
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
                        <div className="p-8">
                            <div className="flex flex-col md:flex-row items-center">
                                <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Coba Asisten {hotelName}</h2>
                                    <p className="text-gray-600 mb-6">
                                        Rasakan langsung bagaimana chatbot kami dapat membantu tamu hotel dengan berbagai pertanyaan umum. 
                                        Klik tombol chat di pojok kanan bawah untuk memulai percakapan.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <div className="bg-amber-100 p-2 rounded-lg mr-3">
                                                <Clock className="w-5 h-5 text-amber-700" />
                                            </div>
                                            <p className="text-gray-700">Informasi check-in/check-out</p>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="bg-amber-100 p-2 rounded-lg mr-3">
                                                <Waves className="w-5 h-5 text-amber-700" />
                                            </div>
                                            <p className="text-gray-700">Detail fasilitas hotel</p>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="bg-amber-100 p-2 rounded-lg mr-3">
                                                <Coffee className="w-5 h-5 text-amber-700" />
                                            </div>
                                            <p className="text-gray-700">Jadwal restoran & layanan</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:w-1/2 flex justify-center">
                                    <div className="bg-gray-50 rounded-xl p-6 w-full max-w-xs">
                                        <div className="bg-white rounded-xl shadow-lg p-6">
                                            <div className="flex items-center mb-4">
                                                <div className="bg-amber-100 p-2 rounded-full mr-3">
                                                    <BotIcon className="w-5 h-5 text-amber-700" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">Asisten {hotelName}</h3>
                                                    <p className="text-xs text-gray-500">Online</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4 mb-4">
                                                <div className="bg-gray-100 rounded-lg p-3 rounded-tl-none">
                                                    <p className="text-sm text-gray-800">Selamat datang di {hotelName}! Ada yang bisa saya bantu?</p>
                                                </div>
                                                <div className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white rounded-lg p-3 rounded-tr-none ml-auto max-w-[80%]">
                                                    <p className="text-sm">Fasilitas apa saja yang tersedia?</p>
                                                </div>
                                                <div className="bg-gray-100 rounded-lg p-3 rounded-tl-none">
                                                    <p className="text-sm text-gray-800">
                                                        {hotelName} memiliki kolam renang outdoor, pusat kebugaran modern, spa, dan restoran dengan pemandangan kota. 
                                                        Semua fasilitas tersedia untuk tamu hotel tanpa biaya tambahan. 
                                                        Lihat galeri foto fasilitas kami <span className="text-amber-600 font-medium inline-flex items-center cursor-pointer hover:text-amber-700 hover:underline transition-colors">di sini<ExternalLink className="w-3 h-3 ml-1" /></span>.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center bg-gray-100 rounded-full px-3 py-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Ketik pesan..." 
                                                    className="bg-transparent flex-1 text-sm focus:outline-none text-gray-800 placeholder-gray-400"
                                                    disabled
                                                />
                                                <button className="text-amber-600">
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Solusi Chatbot untuk Perhotelan</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Dengan teknologi AI terkini, chatbot {hotelName} dapat membantu menjawab pertanyaan umum tamu, 
                            memberikan informasi fasilitas, dan mengurangi beban kerja staf resepsionis, 
                            sehingga mereka dapat fokus pada layanan yang lebih personal.
                        </p>
                    </div>
                </div>
            </div>

            {/* Floating Chatbot Component */}
            <ChatbotFloater site={site} />
        </>
    );
}

// Membungkus halaman dengan layout dashboard
ChatbotDemo.layout = (page) => <AuthenticatedLayout>{page}</AuthenticatedLayout>;