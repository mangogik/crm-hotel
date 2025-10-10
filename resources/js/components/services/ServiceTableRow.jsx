import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, ChevronDown, ChevronRight, Info } from "lucide-react";

const ServiceTableRow = ({
    service,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    formatPrice,
    formatType,
    formatFulfillment,
    getTypeBadge,
    getFulfillmentBadge,
    getOfferingSessionBadge,
}) => {
    // Helper untuk menampilkan harga
    const renderPrice = () => {
        if (service.type === "selectable") {
            return (
                <div className="flex items-center gap-1">
                    <span className="text-sm">Multiple options</span>
                    <Info className="h-3 w-3 text-muted-foreground" />
                </div>
            );
        }

        // Jika harga 0 → tampilkan "Free"
        if (!service.price || Number(service.price) === 0) {
            return <span>Free</span>;
        }

        // Default format
        return formatPrice(service.price);
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
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>{getTypeBadge(service.type, service.unit_name)}</TableCell>
                <TableCell>{getFulfillmentBadge(service.fulfillment_type)}</TableCell>
                <TableCell>{getOfferingSessionBadge(service.offering_session)}</TableCell>

                {/* ✅ Menampilkan harga / Free */}
                <TableCell>{renderPrice()}</TableCell>

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
                <TableRow key={`${service.id}-details`}>
                    <TableCell colSpan={7} className="p-4 bg-muted/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-medium text-sm mb-1">
                                    Description
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    {service.description ||
                                        "No description provided."}
                                </p>
                            </div>

                            {service.type === "selectable" &&
                                service.options?.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-sm mb-2">
                                            Available Options:
                                        </h4>
                                        <div className="space-y-2">
                                            {service.options.map(
                                                (option, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex justify-between items-center p-2 bg-background border rounded"
                                                    >
                                                        <span>
                                                            {option.name}
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatPrice(option.price)}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

export default ServiceTableRow;
