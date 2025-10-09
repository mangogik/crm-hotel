import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, CreditCard } from "lucide-react";
import PaymentTableRow from "@/components/payments/PaymentTableRow";

const PaymentsTable = ({
    payments,
    expandedRows,
    toggleRow,
    onEdit,
    onDelete,
    getStatusBadge,
    getMethodBadge,
    formatPrice,
    formatDate,
    formatDateTime,
    sortBy,
    sortDirection,
    handleSort,
}) => {
    const SortHead = ({ field, children }) => (
        <TableHead
            className="cursor-pointer"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center gap-1">
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
                        <TableHead className="w-12"></TableHead>
                        <SortHead field="order.customer.name">Customer</SortHead>
                        <TableHead>Country</TableHead>
                        <SortHead field="status">Status</SortHead>
                        <SortHead field="method">Method</SortHead>
                        <SortHead field="amount">Amount</SortHead>
                        <SortHead field="created_at">Date</SortHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments?.length ? (
                        payments.map((p) => (
                            <PaymentTableRow
                                key={p.id}
                                payment={p}
                                isExpanded={expandedRows.includes(p.id)}
                                onToggle={() => toggleRow(p.id)}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                getStatusBadge={getStatusBadge}
                                getMethodBadge={getMethodBadge}
                                formatPrice={formatPrice}
                                formatDate={formatDate}
                                formatDateTime={formatDateTime}
                            />
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                    <CreditCard className="h-12 w-12 mb-2" />
                                    <p>No payments found</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default PaymentsTable;
