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
    MessageSquare,
    StickyNote,
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
            return (
                path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj) ??
                fallback
            );
        } catch {
            return fallback;
        }
    };

    // ===== Q&A helpers ======================================================
    const safeJson = (v) => {
        if (!v) return null;
        if (typeof v === "object") return v;
        try {
            return JSON.parse(v);
        } catch {
            return null;
        }
    };

    // Build a map serviceId -> { questions: string[], answers: string[] }
    const qaByServiceId = (() => {
        const map = new Map();
        const svcs = Array.isArray(order.services) ? order.services : [];
        svcs.forEach((s) => {
            const pivotAns = safeJson(get(s, "pivot.answers_json", null)); // {questions_snapshot, answers}
            const activeQuestions = get(
                s,
                "active_question.questions_json",
                null
            ); // array of strings

            // Prefer snapshot (frozen at purchase time); fallback to current active questions
            const questions = Array.isArray(pivotAns?.questions_snapshot)
                ? pivotAns.questions_snapshot
                : Array.isArray(activeQuestions)
                ? activeQuestions
                : [];

            const answers = Array.isArray(pivotAns?.answers)
                ? pivotAns.answers
                : [];

            if (questions.length || answers.length) {
                map.set(Number(s.id), { questions, answers });
            }
        });
        return map;
    })();
    // =======================================================================

    // ===== 1. Base lines from pivot =====
    const rawServices = Array.isArray(order.services) ? order.services : [];
    const baseLines = rawServices.map((s) => {
        const qty = Number(get(s, "pivot.quantity", 0));
        const unit = Number(get(s, "pivot.price_per_unit", 0));
        return { id: Number(s.id), name: s.name, qty, base: qty * unit };
    });

    const discountBackend = Number(order?.discount_total || 0);
    const promo =
        (Array.isArray(order?.promotions) && order.promotions[0]) || null;

    // ===== 2. Eligible set for promo =====
    let eligibleSet = null;
    if (promo && discountBackend > 0) {
        if (Array.isArray(promo.services)) {
            eligibleSet =
                promo.services.length > 0
                    ? new Set(promo.services.map((s) => Number(s.id)))
                    : new Set(baseLines.map((ln) => ln.id));
        }
    }

    // ===== 3. Final lines with discount allocation =====
    let lines = [];
    if (discountBackend > 0 && eligibleSet) {
        const eligibleLines = baseLines.filter((ln) => eligibleSet.has(ln.id));
        const eligibleSubtotal = eligibleLines.reduce(
            (sum, ln) => sum + ln.base,
            0
        );

        lines = baseLines.map((ln) => {
            let lineDiscount = 0;
            if (eligibleSet.has(ln.id) && eligibleSubtotal > 0) {
                const share = ln.base / eligibleSubtotal;
                lineDiscount = discountBackend * share;
            }
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

    const hasQa = qaByServiceId.size > 0;
    const hasNotes =
        typeof order.notes === "string" && order.notes.trim().length > 0;

    return (
        <>
            {/* Main row (collapsed summary) */}
            <TableRow
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={onToggle}
            >
                <TableCell className="w-10">
                    <Button variant="ghost" size="sm">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                </TableCell>

                <TableCell className="font-medium">
                    {order.customer.name}
                </TableCell>

                <TableCell>
                    {order.customer.passport_country ? (
                        <Badge variant="outline">
                            {order.customer.passport_country}
                        </Badge>
                    ) : (
                        "N/A"
                    )}
                </TableCell>

                <TableCell>{getStatusBadge(order.status)}</TableCell>

                <TableCell>
                    {getPaymentBadge(order.payment_preference)}
                </TableCell>

                <TableCell className="font-medium">
                    {formatPrice(headerGrandTotal)}
                </TableCell>

                <TableCell>{formatDate(order.updated_at)}</TableCell>

                <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleEditClick}
                            className={
                                !isEditable
                                    ? "hidden"
                                    : "bg-secondary text-secondary-foreground"
                            }
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDeleteClick}
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
                            {/* Top section: Left column (Customer + Notes) AND Right column (Pricing) */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                {/* LEFT SIDE (Customer + Notes stacked) */}
                                <div className="flex flex-col gap-4 md:col-span-2">
                                    {/* Customer card */}
                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100m flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="bg-blue-100 p-1.5 rounded-full">
                                                <Users className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-slate-800">
                                                Customer
                                            </h3>
                                        </div>

                                        <div className="space-y-2 text-[13px] leading-relaxed">
                                            <div className="flex">
                                                <span className="font-medium w-20 text-slate-600">
                                                    Name
                                                </span>
                                                <span className="text-slate-800">
                                                    {order.customer.name}
                                                </span>
                                            </div>

                                            <div className="flex">
                                                <span className="font-medium w-20 text-slate-600">
                                                    Email
                                                </span>
                                                <span className="text-slate-800">
                                                    {order.customer.email ||
                                                        "N/A"}
                                                </span>
                                            </div>

                                            <div className="flex">
                                                <span className="font-medium w-20 text-slate-600">
                                                    Phone
                                                </span>
                                                <span className="text-slate-800">
                                                    {order.customer.phone ||
                                                        "N/A"}
                                                </span>
                                            </div>

                                            <div className="flex">
                                                <span className="font-medium w-20 text-slate-600">
                                                    Country
                                                </span>
                                                <span className="text-slate-800">
                                                    {order.customer
                                                        .passport_country ||
                                                        "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Notes card (ONLY if there's a note) */}
                                    {hasNotes && (
                                        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100 flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="bg-yellow-100 p-1.5 rounded-full">
                                                    <StickyNote className="h-4 w-4 text-yellow-700" />
                                                </div>
                                                <h3 className="text-sm font-semibold text-slate-800">
                                                    Order Notes
                                                </h3>
                                            </div>

                                            <div className="text-[13px] leading-relaxed text-slate-700 whitespace-pre-line break-words">
                                                {order.notes}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* RIGHT SIDE (Pricing card) */}
                                <div className="bg-white rounded-lg p-4 shadow-sm md:col-span-3 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-green-100 p-1.5 rounded-full">
                                            <Package className="h-4 w-4 text-green-600" />
                                        </div>
                                        <h3 className="text-sm font-semibold text-slate-800">
                                            Pricing
                                        </h3>
                                    </div>

                                    {/* Compact services table */}
                                    {lines.length > 0 && (
                                        <div className="border rounded-md bg-background overflow-hidden">
                                            <ScrollArea className="h-40">
                                                <Table className="text-[13px]">
                                                    <TableHeader className="bg-slate-50/60">
                                                        <TableRow>
                                                            <TableHead className="w-2/5 py-2">
                                                                Service
                                                            </TableHead>
                                                            <TableHead className="py-2">
                                                                Qty
                                                            </TableHead>
                                                            <TableHead className="py-2">
                                                                Subtotal
                                                            </TableHead>
                                                            <TableHead className="py-2">
                                                                Disc
                                                            </TableHead>
                                                            <TableHead className="text-right py-2">
                                                                Total
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {lines.map((ln) => (
                                                            <TableRow
                                                                key={ln.id}
                                                            >
                                                                <TableCell className="py-2 align-top">
                                                                    <div className="font-medium text-slate-800">
                                                                        {
                                                                            ln.name
                                                                        }
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-2 align-top text-slate-700">
                                                                    {ln.qty}
                                                                </TableCell>
                                                                <TableCell className="py-2 align-top text-slate-700">
                                                                    {formatPrice(
                                                                        ln.lineSubtotal
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="py-2 align-top text-red-600">
                                                                    {ln.lineDiscount >
                                                                    0
                                                                        ? `− ${formatPrice(
                                                                              ln.lineDiscount
                                                                          )}`
                                                                        : "—"}
                                                                </TableCell>
                                                                <TableCell className="py-2 align-top text-right font-medium text-slate-900">
                                                                    {formatPrice(
                                                                        ln.lineTotal
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </ScrollArea>
                                        </div>
                                    )}

                                    {/* Totals */}
                                    <div className="space-y-1.5 mt-3 text-[13px]">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">
                                                Subtotal
                                            </span>
                                            <span className="font-medium text-slate-900">
                                                {formatPrice(visibleSubtotal)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-slate-600">
                                                Discount
                                            </span>
                                            <span className="font-medium text-red-600">
                                                {visibleDiscount > 0
                                                    ? `− ${formatPrice(
                                                          visibleDiscount
                                                      )}`
                                                    : "—"}
                                            </span>
                                        </div>

                                        <div className="border-t pt-2 mt-2 flex justify-between">
                                            <span className="text-slate-800 font-semibold">
                                                Grand Total
                                            </span>
                                            <span className="font-semibold text-slate-900">
                                                {formatPrice(headerGrandTotal)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Q&A Section (if exists) */}
                            {hasQa && (
                                <div className="mt-4 bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-purple-100 p-1.5 rounded-full">
                                            <MessageSquare className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <h3 className="text-sm font-semibold text-slate-800">
                                            Questions & Answers
                                        </h3>
                                    </div>

                                    <div className="space-y-3">
                                        {Array.from(
                                            qaByServiceId.entries()
                                        ).map(([serviceId, qa]) => {
                                            const service = order.services.find(
                                                (s) =>
                                                    Number(s.id) === serviceId
                                            );
                                            if (!service) return null;

                                            return (
                                                <div
                                                    key={serviceId}
                                                    className="border rounded-md p-3 bg-muted/20 text-[13px] leading-relaxed"
                                                >
                                                    <h4 className="font-medium text-slate-800 mb-2">
                                                        {service.name}
                                                    </h4>

                                                    {qa.questions.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {qa.questions.map(
                                                                (
                                                                    question,
                                                                    index
                                                                ) => {
                                                                    const answer =
                                                                        qa
                                                                            .answers[
                                                                            index
                                                                        ] ||
                                                                        "Not answered";
                                                                    return (
                                                                        <div
                                                                            key={
                                                                                index
                                                                            }
                                                                            className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4"
                                                                        >
                                                                            {/* Question side */}
                                                                            <div className="md:col-span-5">
                                                                                <div className="text-[11px] font-medium text-muted-foreground leading-none mb-1 flex items-start gap-1">
                                                                                    <span>
                                                                                        Question
                                                                                    </span>
                                                                                </div>

                                                                                <div className="text-[13px] font-medium text-slate-800 leading-snug break-words whitespace-pre-line">
                                                                                    {
                                                                                        question
                                                                                    }
                                                                                </div>
                                                                            </div>

                                                                            {/* Answer side */}
                                                                            <div className="md:col-span-7">
                                                                                <div className="text-[11px] font-medium text-muted-foreground leading-none mb-1 flex items-start gap-1">
                                                                                    <span>
                                                                                        Answer
                                                                                    </span>
                                                                                </div>

                                                                                <div className="text-[13px] text-slate-700 leading-snug break-words whitespace-pre-line">
                                                                                    {answer ||
                                                                                        "Not answered"}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-[13px] text-muted-foreground">
                                                            No questions for
                                                            this service.
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
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

export default OrderTableRow;
