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
import { Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const CustomerTableRow = ({
    customer,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    formatDate,
}) => {
    const getMembershipBadgeVariant = (type) => {
        switch (type) {
            case "platinum":
                return "default";
            case "gold":
                return "warning";
            case "silver":
                return "outline";
            default:
                return "destructive";
        }
    };

    const capitalizeWords = (str) => {
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
                <TableCell>
                    <Button variant="ghost" size="sm">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                </TableCell>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.email || "N/A"}</TableCell>
                <TableCell>{customer.phone || "N/A"}</TableCell>
                <TableCell>
                    {customer.passport_country && (
                        <Badge variant="outline">
                            {customer.passport_country}
                        </Badge>
                    )}
                </TableCell>
                <TableCell>
                    <Badge variant="outline">
                        {customer.total_visits}{" "}
                        {customer.total_visits > 1 ? "Visits" : "Visit"}
                    </Badge>
                </TableCell>
                <TableCell>
                    {customer.membership ? (
                        <Badge
                            variant={getMembershipBadgeVariant(
                                customer.membership.membership_type
                            )}
                        >
                            {capitalizeWords(
                                customer.membership.membership_type
                            )}
                            {customer.membership.discount_percentage > 0 &&
                                ` (${customer.membership.discount_percentage}%)`}
                        </Badge>
                    ) : (
                        <span className="text-muted-foreground">None</span>
                    )}
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

            {/* BAGIAN DETAIL YANG DIPERLUAS */}
            {isExpanded && (
                <TableRow key={`${customer.id}-details`}>
                    <TableCell colSpan={8} className="p-4 bg-muted/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Kolom 1: Customer Information */}
                            <div>
                                <h5 className="text-sm font-medium mb-2">
                                    Notes
                                </h5>
                                <p className="text-sm text-muted-foreground">
                                    {customer.notes ||
                                        "No notes for this customer."}
                                </p>
                            </div>

                            {/* Kolom 2: Booking History */}
                            <div>
                                <h5 className="text-sm font-medium mb-2">
                                    Booking History
                                </h5>
                                {customer.bookings &&
                                customer.bookings.length > 0 ? (
                                    <div className="border rounded-md bg-background">
                                        <ScrollArea className="h-64">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Check-in Date
                                                        </TableHead>
                                                        <TableHead>
                                                            Room
                                                        </TableHead>
                                                        <TableHead>
                                                            Status
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {customer.bookings.map(
                                                        (booking) => (
                                                            <TableRow
                                                                key={booking.id}
                                                            >
                                                                <TableCell>
                                                                    {formatDate(
                                                                        booking.checkin_at
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {booking.room_number ||
                                                                        "N/A"}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {capitalizeWords(
                                                                        booking.status
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No booking history found.
                                    </p>
                                )}
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

export default CustomerTableRow;
