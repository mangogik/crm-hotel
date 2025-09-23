import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import ServiceTableRow from "./ServiceTableRow";

const ServicesTable = ({
    services,
    expandedRows,
    toggleRow,
    openEditModal,
    openDeleteModal,
    formatPrice,
    formatType,
    formatFulfillment,
    sortBy,
    sortDirection,
    handleSort,
    getTypeBadge,
    getFulfillmentBadge,
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
                        <SortableHeader field="type">Type</SortableHeader>
                        <SortableHeader field="fulfillment_type">
                            Fulfillment
                        </SortableHeader>
                        <SortableHeader field="price">Price</SortableHeader>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {services.length > 0 ? (
                        services.map((service) => (
                            <ServiceTableRow
                                key={service.id}
                                service={service}
                                isExpanded={expandedRows.includes(service.id)}
                                onToggle={() => toggleRow(service.id)}
                                onEdit={() => openEditModal(service)}
                                onDelete={() => openDeleteModal(service)}
                                formatPrice={formatPrice}
                                formatType={formatType}
                                formatFulfillment={formatFulfillment}
                                getTypeBadge={getTypeBadge}
                                getFulfillmentBadge={getFulfillmentBadge}
                            />
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                                No services found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default ServicesTable;
