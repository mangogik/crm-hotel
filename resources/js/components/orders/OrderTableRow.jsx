import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { toast } from "sonner";
import { Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

const OrderTableRow = ({
    order,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    getStatusBadge,
    getPaymentBadge,
    formatPrice,
    formatDate,
}) => {
    const isEditable = order.status === "pending";

    const handleEditClick = (e) => {
        e.stopPropagation(); // Mencegah baris ikut terbuka saat tombol diklik
        if (isEditable) {
            onEdit();
        } else {
            toast.info("Pesanan ini telah diproses dan tidak dapat diubah.");
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete();
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
                <TableCell className="font-medium">
                    {order.customer.name}
                </TableCell>
                <TableCell>
                    {order.customer.passport_country ? (
                        <Badge variant="outline">
                            {order.customer.passport_country}
                        </Badge>
                    ) : (
                        "N/A"
                    )}
                </TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>{getPaymentBadge(order.payment_method)}</TableCell>
                <TableCell className="font-medium">
                    {formatPrice(order.total_price)}
                </TableCell>
                <TableCell>{formatDate(order.created_at)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleEditClick}
                            className={
                                !isEditable
                                    ? "hidden cursor-not-allowed"
                                    : "bg-secondary text-secondary-foreground"
                            }
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDeleteClick}
                            className="bg-destructive text-destructive-foreground"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
            {isExpanded && (
                <TableRow key={`${order.id}-details`}>
                    <TableCell colSpan={8} className="p-4 bg-muted/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h5 className="text-sm font-medium mb-2">
                                    Customer Information
                                </h5>
                                <div className="space-y-1 text-sm">
                                    {[
                                        {
                                            label: "Name",
                                            value: order.customer.name,
                                        },
                                        {
                                            label: "Email",
                                            value:
                                                order.customer.email || "N/A",
                                        },
                                        {
                                            label: "Phone",
                                            value:
                                                order.customer.phone || "N/A",
                                        },
                                        {
                                            label: "Country",
                                            value:
                                                order.customer
                                                    .passport_country || "N/A",
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.label}
                                            className="grid grid-cols-5"
                                        >
                                            <span className="font-medium col-span-1">
                                                {item.label}
                                            </span>
                                            <span className="col-span-4">
                                                : {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium mb-2">
                                    Services
                                </h5>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Service</TableHead>
                                                <TableHead>Quantity</TableHead>
                                                <TableHead>
                                                    Price/Unit
                                                </TableHead>
                                                <TableHead>Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {order.services.map((service) => (
                                                <TableRow key={service.id}>
                                                    <TableCell>
                                                        {service.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        {service.pivot.quantity}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatPrice(
                                                            service.pivot
                                                                .price_per_unit
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatPrice(
                                                            service.pivot
                                                                .price_per_unit *
                                                                service.pivot
                                                                    .quantity
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

export default OrderTableRow;
