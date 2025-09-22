import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { ArrowUpDown } from "lucide-react";
import OrderTableRow from "./OrderTableRow";

const OrdersTable = ({
    orders,
    expandedRows,
    toggleRow,
    openEditModal,
    openDeleteModal,
    getStatusBadge,
    getPaymentBadge,
    formatPrice,
    formatDate,
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
                        <SortableHeader field="customer.name">
                            Customer
                        </SortableHeader>
                        <TableHead>Country</TableHead>
                        <SortableHeader field="status">Status</SortableHeader>
                        <SortableHeader field="payment_method">
                            Payment
                        </SortableHeader>
                        {/* <SortableHeader field="total_price">
                            Total
                        </SortableHeader> */}
                        <TableHead>Total</TableHead>
                        <SortableHeader field="created_at">Date</SortableHeader>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {console.log(orders)}
                    {orders.length > 0 ? (
                        orders.map((order) => (
                            <OrderTableRow
                                key={order.id}
                                order={order}
                                isExpanded={expandedRows.includes(order.id)}
                                onToggle={() => toggleRow(order.id)}
                                onEdit={() => openEditModal(order)}
                                onDelete={() => openDeleteModal(order)}
                                getStatusBadge={getStatusBadge}
                                getPaymentBadge={getPaymentBadge}
                                formatPrice={formatPrice}
                                formatDate={formatDate}
                            />
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                                No orders found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default OrdersTable;
