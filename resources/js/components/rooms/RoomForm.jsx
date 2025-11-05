import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm, router } from "@inertiajs/react";
import { useState, useEffect, useMemo } from "react";
import {
    Plus,
    Home,
    Info,
    Image as ImageIcon,
    Loader2,
    X,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
// Ganti path relatif dengan alias path
import RoomTypeForm from "@/components/rooms/RoomTypeForm"; 

/* ---------- Konstanta validasi gambar ---------- */
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/* ---------- Skeleton Gambar ---------- */
const ImgSkeleton = ({ size = "w-16 h-16" }) => (
    <div
        className={`${size} rounded-md border bg-muted/40 animate-pulse flex items-center justify-center text-[10px] text-muted-foreground`}
    >
        <Loader2 className="w-4 h-4 animate-spin opacity-60" />
    </div>
);

/* ---------- Komponen Preview Gambar ---------- */
function GeneralImagesPreview({
    mode,
    existingGeneralImages = [],
    newGeneralPreviews = [],
    onDeleteExisting,
    onDeleteNew,
    onAddNewSafe,
    localError,
    loadingImagesForEdit = false,
}) {
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {mode === "edit" && loadingImagesForEdit && (
                    <>
                        <ImgSkeleton />
                        <ImgSkeleton />
                    </>
                )}

                {mode === "edit" &&
                    !loadingImagesForEdit &&
                    existingGeneralImages.length > 0 &&
                    existingGeneralImages.map((img) => (
                        <div
                            key={img.id}
                            className="relative w-16 h-16 border rounded-md bg-white shadow-sm overflow-hidden"
                        >
                            <img
                                src={img.url ?? `/storage/${img.image_path}`}
                                alt={img.caption || "room image"}
                                className="object-cover w-full h-full"
                            />
                            <button
                                type="button"
                                className="absolute top-0 right-0 bg-red-600 text-white rounded-bl-md px-1 py-[2px] text-[10px] flex items-center gap-1"
                                onClick={() => onDeleteExisting(img.id)}
                                title="Remove this image"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}

                {newGeneralPreviews.length > 0 &&
                    newGeneralPreviews.map((item, idx) => (
                        <div
                            key={`new-${idx}`}
                            className="relative w-16 h-16 border rounded-md bg-white ring-2 ring-purple-500/40 shadow-sm overflow-hidden"
                        >
                            <img
                                src={item.url}
                                alt={item.file?.name || "new image"}
                                className="object-cover w-full h-full"
                            />
                            <button
                                type="button"
                                className="absolute top-0 right-0 bg-purple-600 text-white rounded-bl-md px-1 py-[2px] text-[10px] flex items-center gap-1"
                                onClick={() => onDeleteNew(idx)}
                                title="Remove this new image"
                            >
                                <X className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-[9px] leading-tight px-1 py-[2px] text-center">
                                new
                            </div>
                        </div>
                    ))}
            </div>

            <div className="flex flex-col gap-1">
                <label className="inline-flex items-center gap-1 px-2 py-1.5 text-xs border rounded-md bg-white hover:bg-muted cursor-pointer w-fit">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onAddNewSafe(e.target.files)}
                    />
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Add Images</span>
                </label>

                {localError ? (
                    <div className="text-[10px] text-red-600 leading-tight">
                        {localError}
                    </div>
                ) : (
                    <div className="text-[10px] text-muted-foreground leading-tight">
                        JPG / PNG / WebP • max 2MB each.
                    </div>
                )}
            </div>
        </div>
    );
}

/* ---------- MAIN COMPONENT ---------- */
const RoomForm = ({
    roomTypes = [],
    initialData = null,
    onSuccess,
    onCancel,
    onModeChange,
}) => {
    const [isRangeMode, setIsRangeMode] = useState(false);
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [galleryError, setGalleryError] = useState("");

    const isEditMode = !!initialData;

    const { data, setData, post, processing, errors, reset } = useForm({
        is_range: false,
        room_number: initialData?.room_number || "",
        start_room: "",
        end_room: "",
        room_type_id:
            initialData?.room_type_id ||
            initialData?.room_type?.id ||
            "",
        status: initialData?.status || "available",
        images: [],
        images_to_delete: [],
        _existingImages: initialData?.images || [],
        _newImagePreviews: [],
    });

    useEffect(() => {
        if (onModeChange) onModeChange(isRangeMode);
    }, [isRangeMode, onModeChange]);

    useEffect(() => {
        setData({
            is_range: false,
            room_number: initialData?.room_number || "",
            start_room: "",
            end_room: "",
            room_type_id: initialData?.room_type_id || initialData?.room_type?.id || "",
            status: initialData?.status || "available",
            images: [],
            images_to_delete: [],
            _existingImages: initialData?.images || [],
            _newImagePreviews: [],
        });
        setGalleryError("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData]);

    const handleRangeToggle = (checked) => {
        setIsRangeMode(checked);
        setData("is_range", checked);
        if (checked) {
            setData("room_number", "");
        } else {
            setData("start_room", "");
            setData("end_room", "");
        }
    };

    /* ---------- Validasi & manipulasi gambar ---------- */
    const onAddNewSafe = (fileList) => {
        if (!fileList || !fileList.length) return;

        const goodFiles = [];
        const previewsToAdd = [];
        let badReason = "";

        Array.from(fileList).forEach((file) => {
            if (file.size > MAX_SIZE_BYTES) {
                badReason = "One or more images exceed 2MB.";
                return;
            }
            if (!ALLOWED_TYPES.includes(file.type)) {
                badReason = "Only JPG, PNG, or WebP images are allowed.";
                return;
            }
            goodFiles.push(file);
            previewsToAdd.push({ file: file, url: URL.createObjectURL(file) });
        });

        if (badReason) {
            setGalleryError(badReason);
        } else {
            setGalleryError("");
        }

        if (goodFiles.length > 0) {
            setData((prevData) => ({
                ...prevData,
                images: [...prevData.images, ...goodFiles],
                _newImagePreviews: [
                    ...prevData._newImagePreviews,
                    ...previewsToAdd,
                ],
            }));
        }
    };

    const removeNewGeneralPreview = (idxToRemove) => {
        setData((prevData) => ({
            ...prevData,
            images: prevData.images.filter((_, i) => i !== idxToRemove),
            _newImagePreviews: prevData._newImagePreviews.filter(
                (_, i) => i !== idxToRemove
            ),
        }));
    };

    const markDeleteGeneralImage = (imgId) => {
        setData((prevData) => ({
            ...prevData,
            images_to_delete: [...prevData.images_to_delete, imgId],
            _existingImages: prevData._existingImages.filter(
                (img) => img.id !== imgId
            ),
        }));
    };

    /* ---------- Submit ---------- */
    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSubmit = { ...data };
        delete dataToSubmit._existingImages;
        delete dataToSubmit._newImagePreviews;

        if (isEditMode) {
            router.post(
                route("rooms.update", initialData.id),
                {
                    _method: "PUT",
                    ...dataToSubmit,
                },
                {
                    onSuccess: () => {
                        reset();
                        onSuccess();
                    },
                    onError: () => {
                        setData("_existingImages", initialData?.images || []);
                    },
                }
            );
        } else {
            post(route("rooms.store"), {
                data: dataToSubmit,
                onSuccess: () => {
                    reset();
                    onSuccess();
                },
            });
        }
    };

    const handleCancel = () => {
        reset();
        onCancel();
    };

    /* ---------- Helper hitung jumlah room ---------- */
    const calculateRoomCount = () => {
        if (!isRangeMode || !data.start_room || !data.end_room) return 0;
        const startMatch = data.start_room.match(/^([^\d]*)(\d+)$/);
        const endMatch = data.end_room.match(/^([^\d]*)(\d+)$/);
        if (startMatch && endMatch && startMatch[1] === endMatch[1]) {
            const startNum = parseInt(startMatch[2]);
            const endNum = parseInt(endMatch[2]);
            return Math.max(0, endNum - startNum + 1);
        }
        if (!isNaN(data.start_room) && !isNaN(data.end_room)) {
            return Math.max(
                0,
                parseInt(data.end_room) - parseInt(data.start_room) + 1
            );
        }
        return 0;
    };

    const roomCount = calculateRoomCount();

    const afterCreateType = () => {
        setIsTypeModalOpen(false);
        router.reload({ only: ["roomTypes"] });
    };

    /* ---------- Validasi Frontend ---------- */
    const isFormValid = useMemo(() => {
        // 1. Cek field umum yang wajib
        if (!data.room_type_id) {
            return false;
        }

        // 2. Cek validasi gambar (berbeda untuk create vs edit)
        if (isEditMode) {
            const remainingImageCount = data._existingImages.length + data.images.length;
            if (remainingImageCount === 0) {
                return false;
            }
        } else {
            // Mode CREATE
            if (data.images.length === 0) {
                return false;
            }
        }

        // 3. Cek field berdasarkan mode (Single vs Range)
        if (isRangeMode) {
            if (!data.start_room.trim() || !data.end_room.trim()) {
                return false;
            }
        } else {
            // Mode SINGLE
            if (!data.room_number.trim()) {
                return false;
            }
        }
        return true;
    }, [
        isEditMode,
        isRangeMode,
        data.room_number,
        data.start_room,
        data.end_room,
        data.room_type_id,
        data.images.length, 
        data._existingImages.length, 
    ]);

    /* ---------- Render ---------- */
    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                {!isRangeMode && (
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <Home className="h-5 w-5" />
                                {isEditMode ? "Edit Single Room" : "Create Single Room"}
                            </CardTitle>
                            <CardDescription>
                                {isEditMode ? `Editing room ${initialData.room_number}` : "Create a single room"}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Room Number */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="room_number"
                                    className="text-right"
                                >
                                    Room Number *
                                </Label>
                                <Input
                                    id="room_number"
                                    value={data.room_number}
                                    onChange={(e) =>
                                        setData("room_number", e.target.value)
                                    }
                                    className="col-span-3"
                                    placeholder="e.g., 101, A201"
                                />
                                {errors.room_number && (
                                    <p className="text-red-500 text-sm col-span-4 text-right">
                                        {errors.room_number}
                                    </p>
                                )}
                            </div>

                            {/* Room Type */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="room_type_id"
                                    className="text-right"
                                >
                                    Room Type *
                                </Label>
                                <div className="col-span-3 flex gap-2">
                                    <Select
                                        value={String(data.room_type_id || "")}
                                        onValueChange={(value) =>
                                            setData("room_type_id", value === "" ? null : Number(value))
                                        }
                                    >
                                        <SelectTrigger
                                            className="flex-1"
                                        >
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* --- PERBAIKAN: Hapus item value="" --- */}
                                            {/* <SelectItem value="">Select type</SelectItem> */}
                                            {roomTypes.map((t) => (
                                                <SelectItem
                                                    key={t.id}
                                                    value={String(t.id)}
                                                >
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setIsTypeModalOpen(true)
                                        }
                                    >
                                        Add Type
                                    </Button>
                                </div>
                                {errors.room_type_id && (
                                    <p className="text-red-500 text-sm col-span-4 text-right">
                                        {errors.room_type_id}
                                    </p>
                                )}
                            </div>

                            {/* Status */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="status"
                                    className="text-right"
                                >
                                    Status *
                                </Label>
                                <Select
                                    value={data.status || "available"}
                                    onValueChange={(v) => setData("status", v)}
                                >
                                    <SelectTrigger
                                        className="col-span-3"
                                    >
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">
                                            Available
                                        </SelectItem>
                                        <SelectItem value="maintenance">
                                            Maintenance
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Images */}
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label
                                    htmlFor="images"
                                    className="text-right pt-2"
                                >
                                    Images *
                                </Label>
                                <div className="col-span-3">
                                    <GeneralImagesPreview
                                        mode={isEditMode ? "edit" : "create"}
                                        existingGeneralImages={
                                            data._existingImages
                                        }
                                        newGeneralPreviews={
                                            data._newImagePreviews
                                        }
                                        onDeleteExisting={markDeleteGeneralImage}
                                        onDeleteNew={removeNewGeneralPreview}
                                        onAddNewSafe={onAddNewSafe}
                                        localError={
                                            galleryError || errors.images
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Bulk Mode */}
                {isRangeMode && (
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                Bulk Room Creation
                            </CardTitle>
                            <CardDescription>
                                Create multiple rooms at once
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Range */}
                                <div className="border rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-sm">
                                            Room Number Range
                                        </h4>
                                        {roomCount > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {roomCount} rooms
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <Label
                                                htmlFor="start_room"
                                                className="text-xs font-medium"
                                            >
                                                Start *
                                            </Label>
                                            <Input
                                                id="start_room"
                                                value={data.start_room}
                                                onChange={(e) =>
                                                    setData(
                                                        "start_room",
                                                        e.target.value
                                                    )
                                                }
                                                className="h-8 text-sm"
                                                placeholder="e.g., 101"
                                            />
                                        </div>
                                        <div>
                                            <Label
                                                htmlFor="end_room"
                                                className="text-xs font-medium"
                                            >
                                                End *
                                            </Label>
                                            <Input
                                                id="end_room"
                                                value={data.end_room}
                                                onChange={(e) =>
                                                    setData(
                                                        "end_room",
                                                        e.target.value
                                                    )
                                                }
                                                className="h-8 text-sm"
                                                placeholder="e.g., 110"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Specs */}
                                <div className="border rounded-lg p-3">
                                    <h4 className="font-medium text-sm mb-2">
                                        Specifications
                                    </h4>
                                    <div className="space-y-2">
                                        <div>
                                            <Label
                                                htmlFor="room_type_id_bulk"
                                                className="text-xs font-medium"
                                            >
                                                Type *
                                            </Label>
                                            <div className="flex gap-2">
                                                <Select
                                                    value={String(
                                                        data.room_type_id || ""
                                                    )}
                                                    onValueChange={(v) =>
                                                        setData(
                                                            "room_type_id",
                                                            v === "" ? null : Number(v)
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className="h-8 text-sm flex-1"
                                                    >
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {/* --- PERBAIKAN: Hapus item value="" --- */}
                                                        {/* <SelectItem value="">Select type</SelectItem> */}
                                                        {roomTypes.map((t) => (
                                                            <SelectItem
                                                                key={t.id}
                                                                value={String(
                                                                    t.id
                                                                )}
                                                            >
                                                                {t.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setIsTypeModalOpen(true)
                                                    }
                                                >
                                                    Add Type
                                                </Button>
                                            </div>
                                        </div>
                                        <div>
                                            <Label
                                                htmlFor="status_bulk"
                                                className="text-xs font-medium"
                                            >
                                                Status *
                                            </Label>
                                            <Select
                                                value={
                                                    data.status || "available"
                                                }
                                                onValueChange={(v) =>
                                                    setData("status", v)
                                                }
                                            >
                                                <SelectTrigger
                                                    className="h-8 text-sm"
                                                >
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="available">
                                                        Available
                                                    </SelectItem>
                                                    <SelectItem value="maintenance">
                                                        Maintenance
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Images */}
                                <div className="border rounded-lg p-3">
                                    <h4 className="font-medium text-sm mb-2">
                                        Images *
                                    </h4>
                                    <GeneralImagesPreview
                                        mode="create"
                                        existingGeneralImages={[]}
                                        newGeneralPreviews={
                                            data._newImagePreviews
                                        }
                                        onDeleteExisting={() => {}}
                                        onDeleteNew={removeNewGeneralPreview}
                                        onAddNewSafe={onAddNewSafe}
                                        localError={
                                            galleryError || errors.images
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Images added here will be applied to
                                        ALL rooms created in this batch.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t">
                    {!isEditMode && (
                        <Card className="flex flex-row items-center space-x-2 p-2 rounded-lg">
                            <span
                                className={`text-sm ${
                                    isRangeMode
                                        ? "font-medium"
                                        : "text-muted-foreground"
                                }`}
                            >
                                Bulk Rooms
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    handleRangeToggle(!isRangeMode)
                                }
                                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-muted"
                                role="switch"
                                aria-checked={isRangeMode}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                                        isRangeMode
                                            ? "translate-x-5"
                                            : "translate-x-0"
                                    }`}
                                />
                            </button>
                        </Card>
                    )}

                    {isEditMode && <div />}

                    <div className="flex space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !isFormValid} // Perubahan di sini
                        >
                            {processing
                                ? "Saving..."
                                : isEditMode
                                ? "Update Room"
                                : "Create Room"}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Add Room Type Modal */}
            <Dialog open={isTypeModalOpen} onOpenChange={setIsTypeModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Room Type</DialogTitle>
                    </DialogHeader>
                    <RoomTypeForm
                        onSuccess={afterCreateType}
                        onCancel={() => setIsTypeModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default RoomForm;