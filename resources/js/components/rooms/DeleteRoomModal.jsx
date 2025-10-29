// resources/js/components/rooms/DeleteRoomModal.jsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DeleteRoomModal = ({
  isOpen,
  onOpenChange,
  onConfirm,
  // legacy: jika dipakai untuk Room lama
  room,
  // generic: bisa dipakai untuk entity lain (Room Type, dsb)
  entityLabel,  // contoh: "Room", "Room Type"
  entityValue,  // contoh: "101", "Deluxe"
}) => {
  // Backward compatibility: kalau masih dikirim prop `room`,
  // pakai itu sebagai default label/value.
  const label = entityLabel ?? (room ? "Room" : "Item");
  const value = entityValue ?? (room ? room.room_number : "");

  // kalau tidak ada value sama sekali, tetap render (biar user bisa cancel),
  // tapi deskripsi tidak akan nunjuk nama apapun.
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {label}
            {value ? " " : ""}{value && <strong>{value}</strong>}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteRoomModal;
