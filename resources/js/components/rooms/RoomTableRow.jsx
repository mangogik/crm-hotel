import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

const RoomTableRow = ({ room, isExpanded, onToggle, onEdit, onDelete }) => {
  const formatPrice = (price) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(price ?? 0);

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

        {/* TYPE (object) */}
        <TableCell>{type?.name ?? "-"}</TableCell>

        {/* CAPACITY & PRICE dari room_type */}
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

      {isExpanded && (
        <TableRow key={`${room.id}-details`}>
          <TableCell colSpan={7} className="p-4 bg-muted/20">
            <p className="text-sm text-muted-foreground">No additional details for this room.</p>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default RoomTableRow;
