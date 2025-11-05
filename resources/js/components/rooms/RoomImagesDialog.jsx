import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";

// Fallback image jika URL rusak
const FALLBACK_IMAGE = "https://placehold.co/400x300/e2e8f0/94a3b8?text=No+Image";

function ImageGrid({ images, title }) {
    if (!images || images.length === 0) {
        return null;
    }
    return (
        <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2 text-gray-700">{title}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {images.map((img) => (
                    <div
                        key={img.id}
                        className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100"
                    >
                        <img
                            src={img.url || FALLBACK_IMAGE}
                            alt={img.caption || "Room image"}
                            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function RoomImagesDialog({ open, onOpenChange, roomMeta }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    // --- PERBAIKAN: Sederhanakan state ---
    const [images, setImages] = useState([]);
    console.log("images", roomMeta          )

useEffect(() => {
    if (open && roomMeta?.id) {
        setLoading(true);
        setError("");
        
        const url = typeof route === 'function' 
            ? route("rooms.images", roomMeta.id) 
            : `/rooms/${roomMeta.id}/images`;

        console.log("Fetching images from:", url); // Tambahkan logging ini

        fetch(url)
            .then(async (res) => {
                console.log("Response status:", res.status); // Log status response
                
                if (!res.ok) {
                    const errData = await res.json().catch(() => null);
                    console.error("Error response:", errData); // Log error response
                    throw new Error(errData?.message || `HTTP ${res.status}: ${res.statusText}`);
                }
                return res.json();
            })
            .then((data) => {
                console.log("API Response data:", data); // Log data yang diterima
                setImages(data.room_images || []);
            })
            .catch((err) => {
                console.error("Fetch error:", err); // Log error fetch
                setError(err.message || "Could not load images.");
            })
            .finally(() => {
                setLoading(false);
            });
    }
}, [open, roomMeta]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Images for Room: {roomMeta?.name || "..."}</DialogTitle>
                    <DialogDescription>
                        Review images assigned to this specific room.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading && (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    {error && (
                        <div className="flex flex-col items-center justify-center h-40 text-destructive">
                            <AlertCircle className="h-8 w-8 mb-2" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}
                    {!loading && !error && (
                        <div>
                            {/* --- PERBAIKAN: Hanya render satu grid --- */}
                            <ImageGrid
                                images={images}
                                title="Specific Room Images"
                            />
                            
                            {/* --- PERBAIKAN: Perbarui cek 'no images' --- */}
                            {images.length === 0 && (
                                <p className="text-center text-gray-500 py-10">
                                    No images found for this room.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}