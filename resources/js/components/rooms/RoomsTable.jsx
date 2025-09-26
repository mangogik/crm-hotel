import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import RoomTableRow from "./RoomTableRow";

const RoomsTable = ({
    rooms, expandedRows, toggleRow,
    openEditModal, openDeleteModal,
    sortBy, sortDirection, handleSort,
}) => {

    const SortableHeader = ({ field, children }) => (
        <TableHead className="cursor-pointer" onClick={() => handleSort(field)}>
            <div className="flex items-center space-x-1">
                <span>{children}</span>
                {sortBy === field && (
                    <ArrowUpDown className={`h-3 w-3 ${sortDirection === "asc" ? "" : "rotate-180"}`} />
                )}
            </div>
        </TableHead>
    );

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <SortableHeader field="room_number">Room Number</SortableHeader>
                        <SortableHeader field="room_type">Type</SortableHeader>
                        <SortableHeader field="capacity">Capacity</SortableHeader>
                        <SortableHeader field="price_per_night">Price/Night</SortableHeader>
                        <SortableHeader field="status">Status</SortableHeader>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rooms.length > 0 ? (
                        rooms.map((room) => (
                            <RoomTableRow
                                key={room.id}
                                room={room}
                                isExpanded={expandedRows.includes(room.id)}
                                onToggle={() => toggleRow(room.id)}
                                onEdit={() => openEditModal(room)}
                                onDelete={() => openDeleteModal(room)}
                            />
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">No rooms found</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default RoomsTable;
