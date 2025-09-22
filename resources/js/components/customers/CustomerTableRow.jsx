import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

const CustomerTableRow = ({
    customer,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    formatDate,
}) => {
    return (
        <>
            <TableRow
                className="cursor-pointer hover:bg-muted/50"
                onClick={onToggle}
            >
                <TableCell>
                    <Button variant="ghost" size="sm">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                </TableCell>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.email || "N/A"}</TableCell>
                <TableCell>{customer.phone || "N/A"}</TableCell>
                <TableCell>
                    {customer.passport_country && <Badge variant="outline">{customer.passport_country}</Badge>}
                </TableCell>
                <TableCell>{formatDate(customer.checkin_at)}</TableCell>
                <TableCell>{formatDate(customer.checkout_at)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={onEdit}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onDelete}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
            {isExpanded && (
                <TableRow key={`${customer.id}-details`}>
                    <TableCell colSpan={8} className="p-4 bg-muted/20">
                         <div>
                            <h4 className="font-medium text-sm mb-1">Notes</h4>
                            <p className="text-sm text-muted-foreground">
                                {customer.notes || "No notes for this customer."}
                            </p>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

export default CustomerTableRow;
