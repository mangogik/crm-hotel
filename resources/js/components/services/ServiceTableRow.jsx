import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}) => {
    return (
        <>
            <TableRow
                className="cursor-pointer hover:bg-muted/50"
                onClick={onToggle}
            >
                <TableCell>
                    {/* Tombol dropdown sekarang ada di setiap baris */}
                    <Button variant="ghost" size="sm">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                </TableCell>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>
                    <Badge variant="outline">
                        {formatType(service.type)}
                        {service.type === "per_unit" && ` (${service.unit_name})`}
                    </Badge>
                </TableCell>
                <TableCell>
                    <Badge variant="secondary">{formatFulfillment(service.fulfillment_type)}</Badge>
                </TableCell>
                <TableCell>
                    {service.type === "selectable" ? (
                        <div className="flex items-center gap-1">
                            <span className="text-sm">Multiple options</span>
                            <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                    ) : (
                        formatPrice(service.price)
                    )}
                </TableCell>
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
            
            {/* Tampilan Detail yang diperluas */}
            {isExpanded && (
                <TableRow key={`${service.id}-details`}>
                    <TableCell colSpan={6} className="p-4 bg-muted/20">
                        {/* Menggunakan grid 2 kolom seperti pada Order Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Kolom Kiri: Deskripsi */}
                            <div>
                                <h4 className="font-medium text-sm mb-1">Description</h4>
                                <p className="text-sm text-muted-foreground">
                                    {service.description || "No description provided."}
                                </p>
                            </div>

                            {/* Kolom Kanan: Opsi jika tipe layanan adalah 'selectable' */}
                            {service.type === 'selectable' && service.options?.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-sm mb-2">Available Options:</h4>
                                    <div className="space-y-2">
                                        {service.options.map((option, index) => (
                                            <div key={index} className="flex justify-between items-center p-2 bg-background border rounded">
                                                <span>{option.name}</span>
                                                <span className="font-medium">{formatPrice(option.price)}</span>
                                            </div>
                                        ))}
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

