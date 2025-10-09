import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import {
    Pencil,
    Trash2,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    CreditCard,
    Calendar,
} from "lucide-react";

const PaymentTableRow = ({
    payment,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    getStatusBadge,
    getMethodBadge,
    formatPrice,
    formatDate,
    formatDateTime,
}) => {
    return (
        <>
            <TableRow
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={onToggle}
            >
                <TableCell className="w-12">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <div className="font-medium">
                                {payment.order?.customer?.name || "Unknown"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {payment.order?.customer?.email || "No email"}
                            </div>
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                    {payment.order?.customer?.passport_country ? (
                        <Badge variant="outline" className="text-xs">
                            {payment.order.customer.passport_country}
                        </Badge>
                    ) : (
                        <span className="text-muted-foreground text-sm">
                            N/A
                        </span>
                    )}
                </TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                <TableCell>{getMethodBadge(payment.method)}</TableCell>
                <TableCell>
                    <div className="font-semibold">
                        {formatPrice(payment.amount)}
                    </div>
                </TableCell>
                <TableCell>
                    <div className="text-sm">
                        {formatDate(payment.created_at)}
                    </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(payment)}
                            className="bg-secondary text-secondary-foreground"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(payment)}
                            className="bg-destructive text-destructive-foreground"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>

            {isExpanded && (
                <TableRow>
                    <TableCell colSpan={8} className="p-0">
                        <div className="bg-muted/20 p-4 border-b">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                                <div>
                                    <h5 className="font-medium mb-3 flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />{" "}
                                        Payment Details
                                    </h5>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                External ID:
                                            </span>
                                            <span className="font-mono">
                                                {payment.external_id || "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Invoice ID:
                                            </span>
                                            <span className="font-mono">
                                                {payment.invoice_id || "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Paid At:
                                            </span>
                                            <span>
                                                {formatDateTime(
                                                    payment.paid_at
                                                )}
                                            </span>
                                        </div>
                                        {payment.payment_url && (
                                            <div className="flex justify-between items-center mt-3">
                                                <span className="text-muted-foreground">
                                                    Invoice:
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        window.open(
                                                            payment.payment_url,
                                                            "_blank"
                                                        )
                                                    }
                                                    className="text-blue-600 hover:text-blue-700"
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-1" />{" "}
                                                    View Invoice
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h5 className="font-medium mb-3 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> Order
                                        Details
                                    </h5>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Order ID:
                                            </span>
                                            <span className="font-mono">
                                                {payment.order?.id}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Order Date:
                                            </span>
                                            <span>
                                                {formatDateTime(
                                                    payment.order?.created_at
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

export default PaymentTableRow;
