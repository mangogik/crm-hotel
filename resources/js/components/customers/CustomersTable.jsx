import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import CustomerTableRow from "./CustomerTableRow";

const CustomersTable = ({
    customers,
    expandedRows,
    toggleRow,
    openEditModal,
    openDeleteModal,
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
                        <SortableHeader field="name">Name</SortableHeader>
                        <SortableHeader field="email">Email</SortableHeader>
                        <SortableHeader field="phone">Phone</SortableHeader>
                        <SortableHeader field="passport_country">Country</SortableHeader>
                        <SortableHeader field="checkin_at">Check-in</SortableHeader>
                        <SortableHeader field="checkout_at">Check-out</SortableHeader>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customers.length > 0 ? (
                        customers.map((customer) => (
                            <CustomerTableRow
                                key={customer.id}
                                customer={customer}
                                isExpanded={expandedRows.includes(customer.id)}
                                onToggle={() => toggleRow(customer.id)}
                                onEdit={() => openEditModal(customer)}
                                onDelete={() => openDeleteModal(customer)}
                                formatDate={formatDate}
                            />
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                                No customers found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default CustomersTable;
