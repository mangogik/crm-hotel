import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, ChevronDown, ChevronRight, Images } from "lucide-react"; // <-- 1. IMPORT IKON 'Images'

const RoomTableRow = ({ room, isExpanded, onToggle, onEdit, onDelete, onOpenImages }) => { // <-- 2. TERIMA PROP 'onOpenImages'
    const formatPrice = (price) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price ?? 0);

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case "available": return "success";
            case "occupied": return "destructive";
            case "maintenance": return "warning";
            default: return "outline";
        }
    };

    const type = room.room_type; 

    return (
        <>
            <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
                <TableCell>
                    <Button variant="ghost" size="sm">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                </TableCell>

                <TableCell className="font-medium">{room.room_number}</TableCell>
                <TableCell>{type?.name ?? "-"}</TableCell>
                <TableCell>{type?.capacity != null ? `${type.capacity} People` : "-"}</TableCell>
                <TableCell>{type?.price_per_night != null ? formatPrice(type.price_per_night) : "-"}</TableCell>

                <TableCell>
                    <Badge variant={getStatusBadgeVariant(room.status)} className="capitalize">
                        {room.status}
                    </Badge>
                </TableCell>

                <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={onEdit} className="bg-secondary text-secondary-foreground">
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onDelete} className="bg-destructive text-destructive-foreground">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>

            {/* =================================================================== */}
            {/* === 👇 PERUBAHAN 3: MODIFIKASI BLOK 'isExpanded' 👇 === */}
            {/* =================================================================== */}
            {isExpanded && (
                <TableRow key={`${room.id}-details`}>
                    <TableCell colSpan={7} className="p-4 bg-muted/20">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {room.images?.length || 0} images assigned to this room.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenImages(room);
                                }}
                            >
                                <Images className="h-4 w-4" />
                                View Images
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
            )}
            {/* =================================================================== */}
            {/* === 👆 AKHIR PERUBAHAN 3 👆 === */}
            {/* =================================================================== */}
        </>
    );
};

export default RoomTableRow;