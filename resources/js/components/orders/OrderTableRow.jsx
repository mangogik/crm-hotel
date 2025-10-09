import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
    Pencil,
    Trash2,
    ChevronDown,
    ChevronRight,
    Users,
    Package,
} from "lucide-react";

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
    // DEBUGGING: Log the entire order object received by the component
    console.log(`--- DEBUG START: Order ID [${order.id}] ---`, { order });

    const isEditable = order.status === "pending";

    const handleEditClick = (e) => {
        e.stopPropagation();
        if (isEditable) onEdit();
        else toast.info("Pesanan ini telah diproses dan tidak dapat diubah.");
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete();
    };

    const get = (obj, path, fallback = undefined) => {
        try {
            return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj) ?? fallback;
        } catch {
            return fallback;
        }
    };

    // ===== 1. Build base lines from pivot =====
    const rawServices = Array.isArray(order.services) ? order.services : [];
    const baseLines = rawServices.map((s) => {
        const qty = Number(get(s, "pivot.quantity", 0));
        const unit = Number(get(s, "pivot.price_per_unit", 0));
        return {
            id: Number(s.id),
            name: s.name,
            qty,
            base: qty * unit,
        };
    });

    const discountBackend = Number(order?.discount_total || 0);
    const promo = (Array.isArray(order?.promotions) && order.promotions[0]) || null;
    
    // DEBUGGING: Log initial values for discount logic
    console.log(`[Order ID ${order.id}] DEBUG: Initial Values`, { discountBackend, promo });

    // ===== 2. Determine which service IDs are eligible for the promotion =====
    let eligibleSet = null;
    if (promo && discountBackend > 0) {
        if (Array.isArray(promo.services)) {
            if (promo.services.length > 0) {
                eligibleSet = new Set(promo.services.map((s) => Number(s.id)));
            } else {
                eligibleSet = new Set(baseLines.map(ln => ln.id));
            }
        }
    }
    // DEBUGGING: Log the determined set of eligible services
    console.log(`[Order ID ${order.id}] DEBUG: Eligible Services Set`, { eligibleSet });


    // ===== 3. Build final lines with correct discount allocation =====
    let lines = [];
    if (discountBackend > 0 && eligibleSet) {
        const eligibleLines = baseLines.filter((ln) => eligibleSet.has(ln.id));
        const eligibleSubtotal = eligibleLines.reduce((sum, ln) => sum + ln.base, 0);

        // DEBUGGING: Log the scope for discount calculation
        console.log(`[Order ID ${order.id}] DEBUG: Discount Calculation Scope`, { eligibleLines, eligibleSubtotal });

        lines = baseLines.map((ln) => {
            let lineDiscount = 0;
            if (eligibleSet.has(ln.id) && eligibleSubtotal > 0) {
                const share = ln.base / eligibleSubtotal;
                lineDiscount = discountBackend * share;
            }
            // DEBUGGING: Log calculation for each line
            console.log(`[Order ID ${order.id}] DEBUG Line Item (ID: ${ln.id})`, { base: ln.base, share: eligibleSubtotal > 0 ? ln.base / eligibleSubtotal : 0, calculatedDiscount: lineDiscount });

            return {
                id: ln.id,
                name: ln.name,
                qty: ln.qty,
                lineSubtotal: ln.base,
                lineDiscount,
                lineTotal: ln.base - lineDiscount,
            };
        });
    } else {
        // DEBUGGING: Log why the discount logic was skipped
        console.log(`[Order ID ${order.id}] DEBUG: No Discount Path Taken`, { hasDiscount: discountBackend > 0, hasEligibleSet: !!eligibleSet });
        
        lines = baseLines.map((ln) => ({
            id: ln.id,
            name: ln.name,
            qty: ln.qty,
            lineSubtotal: ln.base,
            lineDiscount: 0,
            lineTotal: ln.base,
        }));
    }

    const visibleSubtotal = lines.reduce((sum, l) => sum + l.lineSubtotal, 0);
    const visibleDiscount = lines.reduce((sum, l) => sum + l.lineDiscount, 0);
    const headerGrandTotal = visibleSubtotal - visibleDiscount;

    return (
        <>
            {/* Main row */}
            <TableRow
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={onToggle}
            >
                <TableCell className="w-12">
                    <Button variant="ghost" size="sm">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                </TableCell>
                <TableCell className="font-medium">{order.customer.name}</TableCell>
                <TableCell>
                    {order.customer.passport_country ? (
                        <Badge variant="outline">{order.customer.passport_country}</Badge>
                    ) : ("N/A")}
                </TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>{getPaymentBadge(order.payment_preference)}</TableCell>
                <TableCell className="font-medium">{formatPrice(headerGrandTotal)}</TableCell>
                <TableCell>{formatDate(order.updated_at)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-2">
                        <Button
                            variant="ghost" size="sm" onClick={handleEditClick}
                            className={!isEditable ? "hidden" : "bg-secondary text-secondary-foreground"}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost" size="sm" onClick={handleDeleteClick}
                            className="bg-destructive text-destructive-foreground"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>

            {/* Expanded details row */}
            {isExpanded && (
                <TableRow key={`${order.id}-details`}>
                    <TableCell colSpan={8} className="p-0">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                                <div className="bg-white rounded-lg p-6 shadow-sm md:col-span-2">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <Users className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold">Customer Information</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-5"><span className="font-medium col-span-1">Name</span><span className="col-span-4">{order.customer.name}</span></div>
                                        <div className="grid grid-cols-5"><span className="font-medium col-span-1">Email</span><span className="col-span-4">{order.customer.email || "N/A"}</span></div>
                                        <div className="grid grid-cols-5"><span className="font-medium col-span-1">Phone</span><span className="col-span-4">{order.customer.phone || "N/A"}</span></div>
                                        <div className="grid grid-cols-5"><span className="font-medium col-span-1">Country</span><span className="col-span-4">{order.customer.passport_country || "N/A"}</span></div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg p-6 shadow-sm md:col-span-3">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-green-100 p-2 rounded-full"><Package className="h-5 w-5 text-green-600" /></div>
                                        <h3 className="text-lg font-semibold">Pricing Details</h3>
                                    </div>
                                    {lines.length > 0 && (
                                        <div className="border rounded-lg bg-background overflow-hidden">
                                            <ScrollArea className="h-56">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-2/5">Service</TableHead>
                                                            <TableHead>Qty</TableHead>
                                                            <TableHead>Subtotal</TableHead>
                                                            <TableHead>Discount</TableHead>
                                                            <TableHead className="text-right">Total</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {lines.map((ln) => (
                                                            <TableRow key={ln.id}>
                                                                <TableCell>{ln.name}</TableCell>
                                                                <TableCell>{ln.qty}</TableCell>
                                                                <TableCell>{formatPrice(ln.lineSubtotal)}</TableCell>
                                                                <TableCell className="text-red-600">{ln.lineDiscount > 0 ? `− ${formatPrice(ln.lineDiscount)}` : "—"}</TableCell>
                                                                <TableCell className="text-right font-medium">{formatPrice(ln.lineTotal)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </ScrollArea>
                                        </div>
                                    )}
                                    <div className="space-y-2 mt-4">
                                        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Subtotal</span><span className="font-medium">{formatPrice(visibleSubtotal)}</span></div>
                                        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Discount</span><span className="font-medium text-red-600">{visibleDiscount > 0 ? `− ${formatPrice(visibleDiscount)}` : "—"}</span></div>
                                        <div className="border-t pt-3 mt-2 flex justify-between"><span className="text-sm font-semibold">Grand Total</span><span className="font-semibold">{formatPrice(headerGrandTotal)}</span></div>
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

export default OrderTableRow;

