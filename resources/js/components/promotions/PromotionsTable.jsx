import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { ArrowUpDown, Gift } from "lucide-react";
import PromotionTableRow from "@/components/promotions/PromotionTableRow";

const PromotionsTable = ({
    promotions,
    expandedRows,
    onToggle,
    onEdit,
    onDelete,
    handleSort,
    sortBy,
    sortDirection,
    formatDate,
    formatDateTime,
}) => {
    const SortHead = ({ field, children }) => (
        <TableHead className="cursor-pointer" onClick={() => handleSort(field)}>
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
                        <TableHead className="w-12" />
                        <SortHead field="name">Name</SortHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Action</TableHead>
                        <SortHead field="active">Status</SortHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {promotions?.length ? (
                        promotions.map((p) => (
                            <PromotionTableRow
                                key={p.id}
                                promotion={p}
                                isExpanded={expandedRows.includes(p.id)}
                                onToggle={() => onToggle(p.id)}
                                onEdit={() => onEdit(p)}
                                onDelete={() => onDelete(p)}
                                formatDate={formatDate}
                                formatDateTime={formatDateTime}
                            />
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                    <Gift className="h-12 w-12 mb-2" />
                                    <p>No promotions found</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default PromotionsTable;
