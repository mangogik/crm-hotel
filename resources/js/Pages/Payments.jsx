import { useEffect, useState } from "react";
import { usePage, useForm, router } from "@inertiajs/react";
import AuthenticatedLayout from "../Layouts/AuthenticatedLayout";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import PaymentHeader from "../components/payments/PaymentHeader";
import PaymentFilters from "../components/payments/PaymentFilters";
import PaymentsTable from "../components/payments/PaymentsTable";
import PaymentForm from "../components/payments/PaymentForm";
import Pagination from "../components/payments/Pagination";
import DeletePaymentModal from "../components/payments/DeletePaymentModal";

export default function Payments() {
    const {
        payments,
        filters: initialFilters,
        totals,
        flash,
    } = usePage().props;

    // State for filters and sorting
    const [search, setSearch] = useState(initialFilters?.search || "");
    const [status, setStatus] = useState(initialFilters?.status || "all");
    const [method, setMethod] = useState(initialFilters?.method || "all");
    const [dateRange, setDateRange] = useState(initialFilters?.date_from || "");
    const [sortBy, setSortBy] = useState(
        initialFilters?.sort_by || "created_at"
    );
    const [sortDirection, setSortDirection] = useState(
        initialFilters?.sort_direction || "desc"
    );

    // State for UI interactions
    const [expandedRows, setExpandedRows] = useState([]);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [currentPayment, setCurrentPayment] = useState(null);

    // Form state for editing
    const { data, setData, put, processing, reset } = useForm({
        method: "",
        notes: "",
        status: "pending",
    });

    // Flash messages
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // Debounced filter application
    useEffect(() => {
        const t = setTimeout(() => applyFilters(1), 500);
        return () => clearTimeout(t);
    }, [search, status, method, dateRange, sortBy, sortDirection]);

    const applyFilters = (page = 1) => {
        router.get(
            route("payments.index"),
            {
                search,
                status: status === "all" ? "" : status,
                method: method === "all" ? "" : method,
                date_from: dateRange || "",
                date_to: dateRange || "",
                sort_by: sortBy,
                sort_direction: sortDirection,
                page,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSort = (field) => {
        if (sortBy === field)
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        else {
            setSortBy(field);
            setSortDirection("asc");
        }
    };

    const clearFilters = () => {
        setSearch("");
        setStatus("all");
        setMethod("all");
        setDateRange("");
        setSortBy("created_at");
        setSortDirection("desc");
    };

    const buildPaginationUrl = (url) => {
        if (!url) return null;
        const u = new URL(url);
        const params = new URLSearchParams(u.search);
        params.set("search", search);
        params.set("status", status === "all" ? "" : status);
        params.set("method", method === "all" ? "" : method);
        params.set("date_from", dateRange || "");
        params.set("date_to", dateRange || "");
        params.set("sort_by", sortBy);
        params.set("sort_direction", sortDirection);
        return `${u.pathname}?${params.toString()}`;
    };

    // UI Helpers
    const formatPrice = (v) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(v || 0);
    const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
    const formatDateTime = (d) => (d ? new Date(d).toLocaleString() : "—");

    const getStatusBadge = (s) => {
        let variant = "secondary";
        if (s === "pending") variant = "warning";
        else if (s === "paid") variant = "success";
        else if (s === "failed") variant = "destructive";
        else if (s === "refunded") variant = "purple";
        return (
            <Badge
                variant={variant}
                className="capitalize px-3 py-1 text-xs font-medium w-20 justify-center"
            >
                {s}
            </Badge>
        );
    };

    const getMethodBadge = (m) => {
        let variant = "outline";
        if (m === "cash") variant = "purple";
        else if (m === "online") variant = "info";
        return (
            <Badge
                variant={variant}
                className="capitalize px-3 py-1 text-xs font-medium w-20 justify-center"
            >
                {m || "—"}
            </Badge>
        );
    };

    const toggleRow = (id) =>
        setExpandedRows((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    const openEditModal = (payment) => {
        setCurrentPayment(payment);
        setData({
            method: payment.method,
            notes: payment.notes || "",
            status: payment.status,
        });
        setIsEditOpen(true);
    };

    const openDeleteModal = (payment) => {
        setCurrentPayment(payment);
        setIsDeleteOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        put(route("payments.update", currentPayment.id), {
            onSuccess: () => {
                setIsEditOpen(false);
                reset();
            },
        });
    };

    const handleDelete = () => {
        router.delete(route("payments.destroy", currentPayment.id), {
            preserveState: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
            },
        });
    };

    return (
        <div className="container mx-auto px-4">
            <PaymentHeader totals={totals} />
            <Card>
                <CardContent className="pt-0">
                    <PaymentFilters
                        search={search}
                        setSearch={setSearch}
                        status={status}
                        setStatus={setStatus}
                        method={method}
                        setMethod={setMethod}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        clearFilters={clearFilters}
                    />
                    <PaymentsTable
                        payments={payments.data}
                        expandedRows={expandedRows}
                        toggleRow={toggleRow}
                        onEdit={openEditModal}
                        onDelete={openDeleteModal}
                        getStatusBadge={getStatusBadge}
                        getMethodBadge={getMethodBadge}
                        formatPrice={formatPrice}
                        formatDate={formatDate}
                        formatDateTime={formatDateTime}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        handleSort={handleSort}
                    />
                    <Pagination
                        paginationData={payments}
                        buildPaginationUrl={buildPaginationUrl}
                        router={router}
                    />
                </CardContent>
            </Card>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Payment</DialogTitle>
                        <DialogDescription>
                            Update payment details and change status if needed.
                        </DialogDescription>
                    </DialogHeader>
                    <PaymentForm
                        data={data}
                        setData={setData}
                        onSubmit={handleEditSubmit}
                        processing={processing}
                    />
                </DialogContent>
            </Dialog>

            <DeletePaymentModal
                isOpen={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={handleDelete}
                payment={currentPayment}
            />
        </div>
    );
}

Payments.layout = (page) => <AuthenticatedLayout children={page} />;
