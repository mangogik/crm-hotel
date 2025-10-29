// resources/js/components/rooms/RoomTypesTable.jsx
import { useEffect, useMemo, useState } from "react";
import { router, useForm } from "@inertiajs/react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RoomTypeForm from "@/components/rooms/RoomTypeForm";
import DeleteRoomModal from "@/components/rooms/DeleteRoomModal";

const formatPrice = (price) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(price || 0));

const RoomTypesTable = ({ roomTypes = [] }) => {
  // ================= Sort (client-side) =================
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  const sortedTypes = useMemo(() => {
    const arr = [...roomTypes];
    const dir = sortDirection === "asc" ? 1 : -1;
    return arr.sort((a, b) => {
      if (sortBy === "capacity") return (Number(a.capacity) - Number(b.capacity)) * dir;
      if (sortBy === "price_per_night") return (Number(a.price_per_night) - Number(b.price_per_night)) * dir;
      return String(a.name).localeCompare(String(b.name)) * dir;
    });
  }, [roomTypes, sortBy, sortDirection]);

  const handleSort = (field) => {
    if (sortBy === field) setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDirection("asc"); }
  };

  const SortableHeader = ({ field, children, className = "" }) => (
    <TableHead className={`cursor-pointer ${className}`} onClick={() => handleSort(field)}>
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortBy === field && (
          <ArrowUpDown className={`h-3 w-3 ${sortDirection === "asc" ? "" : "rotate-180"}`} />
        )}
      </div>
    </TableHead>
  );

  // ================= Create dialog =================
  const [openCreate, setOpenCreate] = useState(false);
  const {
    data: createData,
    setData: setCreateData,
    post: postCreate,
    processing: creating,
    errors: createErrors,
    reset: resetCreate,
    clearErrors: clearCreateErrors,
    setDefaults: setCreateDefaults,
  } = useForm({ name: "", capacity: "", price_per_night: "" });

  const openCreateDialog = () => {
    setCreateDefaults({ name: "", capacity: "", price_per_night: "" });
    resetCreate();
    clearCreateErrors();
    setOpenCreate(true);
  };

  const submitCreate = (e) => {
    e.preventDefault();
    postCreate(route("room-types.store"), {
      preserveScroll: true,
      onSuccess: () => {
        resetCreate();
        setOpenCreate(false);
        router.reload({ only: ["roomTypes"] });
      },
    });
  };

  // ================= Edit dialog =================
  const [openEdit, setOpenEdit] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const {
    data: editData,
    setData: setEditData,
    put: putEdit,
    processing: updating,
    errors: editErrors,
    reset: resetEdit,
    clearErrors: clearEditErrors,
    setDefaults: setEditDefaults,
  } = useForm({ name: "", capacity: "", price_per_night: "" });

  const startEdit = (type) => {
    setEditDefaults({ name: "", capacity: "", price_per_night: "" });
    resetEdit();
    clearEditErrors();
    setEditingType(type);
    setEditData({
      name: type.name ?? "",
      capacity: type.capacity ?? "",
      price_per_night: type.price_per_night ?? "",
    });
    setOpenEdit(true);
  };

  const submitEdit = (e) => {
    e.preventDefault();
    if (!editingType) return;
    putEdit(route("room-types.update", editingType.id), {
      preserveScroll: true,
      onSuccess: () => {
        setOpenEdit(false);
        setEditingType(null);
        resetEdit();
        router.reload({ only: ["roomTypes"] });
      },
    });
  };

  // ================= Delete dialog (pakai DeleteRoomModal) =================
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  const openDelete = (type) => {
    setTypeToDelete(type);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!typeToDelete) return;
    router.delete(route("room-types.destroy", typeToDelete.id), {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteOpen(false);
        setTypeToDelete(null);
        router.reload({ only: ["roomTypes"] });
      },
    });
  };

  // Reset forms saat dialog ditutup
  useEffect(() => {
    if (!openCreate) resetCreate();
  }, [openCreate]); // eslint-disable-line

  useEffect(() => {
    if (!openEdit) {
      setEditingType(null);
      resetEdit();
    }
  }, [openEdit]); // eslint-disable-line

  return (
    <div className="mt-10">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Room Types</h3>
          <p className="text-sm text-muted-foreground">Manage room type catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={openCreateDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Type
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <SortableHeader field="name">Name</SortableHeader>
              <SortableHeader field="capacity" className="w-40">Capacity</SortableHeader>
              <SortableHeader field="price_per_night" className="w-48">Price/Night</SortableHeader>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTypes.length ? (
              sortedTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell></TableCell>
                  <TableCell><span className="font-medium">{type.name}</span></TableCell>
                  <TableCell>{type.capacity} People</TableCell>
                  <TableCell>{formatPrice(type.price_per_night)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(type)}
                        className="inline-flex gap-1 bg-secondary text-secondary-foreground"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="inline-flex gap-1 bg-destructive text-destructive-foreground"
                        onClick={() => openDelete(type)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No room types found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ===== CREATE DIALOG ===== */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={submitCreate}>
            <DialogHeader>
              <DialogTitle>Add Room Type</DialogTitle>
            </DialogHeader>

            <RoomTypeForm data={createData} setData={setCreateData} errors={createErrors} />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Saving..." : "Save Type"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT DIALOG ===== */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={submitEdit}>
            <DialogHeader>
              <DialogTitle>Edit Room Type</DialogTitle>
            </DialogHeader>

            <RoomTypeForm data={editData} setData={setEditData} errors={editErrors} />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE DIALOG (pakai DeleteRoomModal) ===== */}
      <DeleteRoomModal
        isOpen={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        entityLabel="Room Type"
        entityValue={typeToDelete?.name ?? ""}
      />
    </div>
  );
};

export default RoomTypesTable;
