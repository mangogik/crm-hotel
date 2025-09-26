import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import BookingTableRow from "./BookingTableRow";

const BookingsTable = ({
    bookings,
    expandedRows,
    toggleRow,
    openEditModal,
    openDeleteModal,
    formatDate,
    formatDateTime,
    sortBy,
    sortDirection,
    handleSort,
}) => {
    const SortableHeader = ({ field, children }) => (
        <TableHead className="cursor-pointer" onClick={() => handleSort(field)}>
            <div className="flex items-center space-x-1">
                <span>{children}</span>
                {sortBy === field && (
                    <ArrowUpDown
                        className={`h-3 w-3 ${
                            sortDirection === "asc" ? "rotate-180" : ""
                        }`}
                    />
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
                        <SortableHeader field="customer_name">Customer</SortableHeader>
                        <SortableHeader field="room_number">Room</SortableHeader>
                        <SortableHeader field="checkin_at">Check-in</SortableHeader>
                        <SortableHeader field="checkout_at">Check-out</SortableHeader>
                        <SortableHeader field="status">Status</SortableHeader>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bookings.length > 0 ? (
                        bookings.map((booking) => (
                            <BookingTableRow
                                key={booking.id}
                                booking={booking}
                                isExpanded={expandedRows.includes(booking.id)}
                                onToggle={() => toggleRow(booking.id)}
                                onEdit={() => openEditModal(booking)}
                                onDelete={() => openDeleteModal(booking)}
                                formatDate={formatDate}
                                formatDateTime={formatDateTime}
                            />
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                                No bookings found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default BookingsTable;