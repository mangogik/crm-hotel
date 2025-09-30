import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

const interactionDisplayMap = {
    view_services: { label: "Service Menu Opened" },
    req_svc: { label: "Service Details Viewed" },
    ord_svc: { label: "Option Selected" },
    confirm_ord: { label: "Order Confirmed" },
    payment: { label: "Payment Method Chosen" },
    rate: { label: "Rating Submitted" },
    cancel: { label: "Order Cancelled" },
};

const BookingTableRow = ({
    booking,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    formatDate,
    formatDateTime,
}) => {
    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case "checked_in":
                return "default";
            case "reserved":
                return "secondary";
            case "checked_out":
                return "outline";
            case "cancelled":
                return "destructive";
            default:
                return "outline";
        }
    };

    const capitalizeWords = (str) => {
        if (!str) return "";
        return str
            .split("_")
            .map(
                (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
    };

    return (
        <>
            <TableRow
                className="cursor-pointer hover:bg-muted/50"
                onClick={onToggle}
            >
                {/* ... Bagian baris utama tidak berubah ... */}
                <TableCell>
                    <Button variant="ghost" size="sm">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                </TableCell>
                <TableCell className="font-medium">
                    {booking.customer.name}
                </TableCell>
                <TableCell>
                    {booking.room.room_number ? (
                        <Badge variant="outline">
                            {booking.room.room_number} -{" "}
                            {booking.room.room_type}
                        </Badge>
                    ) : (
                        <span className="text-muted-foreground">No room</span>
                    )}
                </TableCell>
                <TableCell>{formatDate(booking.checkin_at)}</TableCell>
                <TableCell>{formatDate(booking.checkout_at)}</TableCell>
                <TableCell>
                    <Badge variant={getStatusBadgeVariant(booking.status)}>
                        {capitalizeWords(booking.status)}
                    </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(booking)}
                            className="bg-secondary text-secondary-foreground"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(booking)}
                            className="bg-destructive text-destructive-foreground"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
            {isExpanded && (
                <TableRow key={`${booking.id}-details`}>
                    <TableCell colSpan={7} className="p-4 bg-muted/20">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Kolom Kiri: Notes */}
                            <div className="lg:col-span-1">
                                <h4 className="font-medium text-sm mb-2">
                                    Notes
                                </h4>
                                <p className="text-sm text-muted-foreground break-words">
                                    {booking.notes ||
                                        "No notes for this booking."}
                                </p>
                            </div>

                            {/* Kolom Kanan: Interaction History */}
                            <div className="lg:col-span-2">
                                <h4 className="font-medium text-sm mb-2">
                                    Interaction History
                                </h4>
                                <div className="border rounded-lg bg-background">
                                    <ScrollArea className="h-64">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Interaction
                                                    </TableHead>
                                                    <TableHead>
                                                        Details
                                                    </TableHead>
                                                    <TableHead>Date</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {booking.interactions &&
                                                booking.interactions.length >
                                                    0 ? (
                                                    booking.interactions.map(
                                                        (interaction) => {
                                                            const interactionText =
                                                                interactionDisplayMap[
                                                                    interaction
                                                                        .interaction_type
                                                                ]?.label ||
                                                                capitalizeWords(
                                                                    interaction.interaction_type
                                                                );

                                                            // -- LOGIKA BARU DITAMBAHKAN DI SINI --
                                                            let detailText =
                                                                interaction.details; // Nilai default
                                                            if (
                                                                interaction.interaction_type ===
                                                                "view_services"
                                                            ) {
                                                                detailText =
                                                                    "-"; // Jika view_services, tampilkan "-"
                                                            } else if (
                                                                interaction.interaction_type ===
                                                                    "payment" &&
                                                                interaction
                                                                    .metadata
                                                                    ?.method
                                                            ) {
                                                                detailText =
                                                                    capitalizeWords(
                                                                        interaction
                                                                            .metadata
                                                                            .method
                                                                    ); // Jika payment, tampilkan metode pembayaran
                                                            }

                                                            console.log(
                                                                "detailtext",
                                                                interaction
                                                            );

                                                            return (
                                                                <TableRow
                                                                    key={
                                                                        interaction.id
                                                                    }
                                                                >
                                                                    <TableCell>
                                                                        {
                                                                            interactionText
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {
                                                                            detailText
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell className="text-muted-foreground text-sm">
                                                                        {formatDateTime(
                                                                            interaction.created_at
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        }
                                                    )
                                                ) : (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={3}
                                                            className="h-24 text-center text-muted-foreground"
                                                        >
                                                            No interaction
                                                            history found.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

export default BookingTableRow;
