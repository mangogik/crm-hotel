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
        return str
            .split(" ")
            .map(
                (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
    };

    const getStatusLabel = (status) => {
        return capitalizeWords(status.replace("_", " "));
    };

    // Data dummy untuk customer interactions - fokus pada upselling services
    const customerInteractions = [
        {
            id: 1,
            interaction_type: "promo_opened",
            details: "Summer Spa Package Promotion",
            created_at: "2023-06-15 10:30:00",
        },
        {
            id: 2,
            interaction_type: "service_viewed",
            details: "Premium Room Upgrade",
            created_at: "2023-06-16 14:22:00",
        },
        {
            id: 3,
            interaction_type: "service_ordered",
            details: "Airport Transfer Service",
            created_at: "2023-06-17 09:15:00",
        },
        {
            id: 4,
            interaction_type: "upgrade_requested",
            details: "Ocean View Room Upgrade",
            created_at: "2023-06-18 16:45:00",
        },
        {
            id: 5,
            interaction_type: "addon_purchased",
            details: "Romantic Dinner Package",
            created_at: "2023-06-19 11:20:00",
        },
        {
            id: 6,
            interaction_type: "service_viewed",
            details: "Laundry Express Service",
            created_at: "2023-06-19 15:30:00",
        },
        {
            id: 7,
            interaction_type: "promo_opened",
            details: "Weekend Getaway Discount",
            created_at: "2023-06-20 09:45:00",
        },
        {
            id: 8,
            interaction_type: "service_ordered",
            details: "Late Check-out",
            created_at: "2023-06-20 14:15:00",
        },
        {
            id: 9,
            interaction_type: "addon_purchased",
            details: "Breakfast in Bed",
            created_at: "2023-06-21 08:30:00",
        },
    ];

    return (
        <>
            <TableRow
                className="cursor-pointer hover:bg-muted/50"
                onClick={onToggle}
            >
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
                <TableCell>{formatDateTime(booking.checkin_at)}</TableCell>
                <TableCell>{formatDateTime(booking.checkout_at)}</TableCell>
                <TableCell>
                    <Badge variant={getStatusBadgeVariant(booking.status)}>
                        {getStatusLabel(booking.status)}
                    </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onEdit}
                            className="bg-secondary text-secondary-foreground"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
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
                        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                            {/* Kolom Kiri: Booking Details dan Notes */}
                            <div className="lg:col-span-2">
                                <h4 className="font-medium text-sm mb-2">
                                    Booking Details
                                </h4>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>
                                        Created:{" "}
                                        {formatDateTime(booking.created_at)}
                                    </p>
                                </div>

                                <div className="mt-4">
                                    <h4 className="font-medium text-sm mb-2">
                                        Notes
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {booking.notes ||
                                            "No notes for this booking."}
                                    </p>
                                </div>
                            </div>

                            {/* Kolom Kanan: Customer Interactions */}
                            <div className="lg:col-span-5">
                                <h4 className="font-medium text-sm mb-2">
                                    Customer Interactions
                                </h4>
                                <div className="border rounded-md">
                                    <ScrollArea className="h-64">
                                        <Table className="bg-white">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[150px]">
                                                        Interaction
                                                    </TableHead>
                                                    <TableHead>
                                                        Details
                                                    </TableHead>
                                                    <TableHead className="w-[150px]">
                                                        Date
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {customerInteractions.map(
                                                    (interaction) => (
                                                        <TableRow
                                                            key={interaction.id}
                                                        >
                                                            <TableCell>
                                                                {capitalizeWords(
                                                                    interaction.interaction_type.replace(
                                                                        "_",
                                                                        " "
                                                                    )
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    interaction.details
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {formatDateTime(
                                                                    interaction.created_at
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
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
