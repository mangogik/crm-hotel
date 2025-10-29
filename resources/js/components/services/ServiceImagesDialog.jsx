import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function ServiceImagesDialog({
  open,
  onOpenChange,
  serviceMeta, // { id, name, type }
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [generalImages, setGeneralImages] = useState([]);
  const [optionImages, setOptionImages] = useState([]);

  useEffect(() => {
    if (!open || !serviceMeta?.id) return;

    const fetchImages = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(route("services.images", serviceMeta.id), {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const json = await res.json();
        setGeneralImages(Array.isArray(json.images) ? json.images : []);
        setOptionImages(
          Array.isArray(json.optionImages) ? json.optionImages : []
        );
      } catch (err) {
        console.error("Failed to load images", err);
        setError("Couldn't load images for this service.");
        setGeneralImages([]);
        setOptionImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [open, serviceMeta?.id]);

  // Skeleton untuk kotak foto umum (per thumbnail)
  const ThumbSkeleton = () => (
    <div className="w-24 h-24 rounded-md border bg-muted/40 relative overflow-hidden animate-pulse">
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/70" />
      </div>
    </div>
  );

  // Skeleton untuk kartu foto option (thumbnail + label)
  const OptionCardSkeleton = () => (
    <div className="rounded-md border bg-white p-2 flex flex-col items-center animate-pulse">
      {/* fake thumb */}
      <div className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden mb-2 bg-muted/40 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/70" />
        </div>
      </div>

      {/* fake text lines */}
      <div className="w-full flex flex-col items-center gap-1">
        <div className="h-3 w-20 bg-muted/30 rounded" />
        <div className="h-2 w-16 bg-muted/20 rounded" />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* HEADER */}
        <div className="px-5 py-4 border-b bg-gradient-to-br from-muted/30 to-background">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                {serviceMeta?.name ?? "Service Images"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Preview gallery for guest-facing view
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* BODY (scrollable) */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-6">
            {/* ERROR STATE */}
            {error && !loading && (
                <div className="text-center py-3 px-4 bg-red-50 border border-red-100 rounded-md text-red-600">
                  {error}
                </div>
            )}

            {/* ================= SERVICE IMAGES ================= */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Service Images</h2>
                  <p className="text-sm text-muted-foreground">
                    General visuals
                  </p>
                </div>
                <Badge variant="outline">General</Badge>
              </div>

              {loading ? (
                // loading: tunjukkan 3 skeleton thumbnail dengan spinner di dalamnya
                <div className="flex flex-wrap gap-3">
                  <ThumbSkeleton />
                  <ThumbSkeleton />
                  <ThumbSkeleton />
                </div>
              ) : generalImages.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground border border-dashed rounded-md">
                  No general images uploaded.
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {generalImages.map((img, i) => (
                    <div
                      key={img.id ?? i}
                      className="w-24 h-24 rounded-md border bg-white shadow-sm overflow-hidden relative"
                    >
                      <img
                        src={img.url ?? `/storage/${img.image_path}`}
                        alt={img.caption || `Service image ${i + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ================= OPTION IMAGES ================= */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Option Images</h2>
                  <p className="text-sm text-muted-foreground">
                    Each option has its own thumbnail
                  </p>
                </div>
                <Badge variant="outline">Per Option</Badge>
              </div>

              {loading ? (
                // loading: skeleton card (thumb + 2 baris text) biar grid tetap stabil
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <OptionCardSkeleton />
                  <OptionCardSkeleton />
                </div>
              ) : optionImages.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground border border-dashed rounded-md">
                  No option-specific images uploaded.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {optionImages.map((optImg, i) => (
                    <div
                      key={optImg.id ?? i}
                      className="rounded-md border bg-white p-2 flex flex-col items-center"
                    >
                      {/* Thumbnail */}
                      <div className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden mb-2 bg-muted/20">
                        <img
                          src={
                            optImg.url ?? `/storage/${optImg.image_path}`
                          }
                          alt={optImg.option_name || "Option image"}
                          className="object-contain w-full h-full"
                        />
                      </div>

                      {/* Caption / Name */}
                      <div className="flex-1 min-w-0 w-full text-center">
                        <div className="font-medium text-slate-800 text-sm truncate">
                          {optImg.option_name ||
                            optImg.option_key ||
                            `Option ${i + 1}`}
                        </div>
                        {optImg.caption && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {optImg.caption}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
