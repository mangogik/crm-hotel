import { useEffect, useState } from "react";
import { usePage, useForm, router } from "@inertiajs/react";
import AuthenticatedLayout from "../Layouts/AuthenticatedLayout";
import { toast } from "sonner";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";

import PromotionHeader from "../components/promotions/PromotionHeader";
import PromotionFilters from "../components/promotions/PromotionFilters";
import PromotionsTable from "../components/promotions/PromotionsTable";
import PromotionForm from "../components/promotions/PromotionForm";
import DeletePromotionModal from "../components/promotions/DeletePromotionModal";
import Pagination from "../components/promotions/Pagination";
import { fmtDate, fmtDateTime } from "@/lib/date";

export default function Promotions() {
    const {
        promotions,
        filters: initial,
        stats,
        services = [],
        flash,
    } = usePage().props;

    const [search, setSearch] = useState(initial?.search || "");
    const [type, setType] = useState(initial?.type || "all");
    const [active, setActive] = useState(
        initial?.active === undefined ? "all" : initial?.active
    );
    const [sortBy, setSortBy] = useState(initial?.sort_by || "updated_at");
    const [sortDirection, setSortDirection] = useState(
        initial?.sort_direction || "desc"
    );

    const [expandedRows, setExpandedRows] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [current, setCurrent] = useState(null);

    const form = useForm({
        name: "",
        type: "birthday",
        active: true,
        discount_percent: "",
        discount_amount: "",
        free_service_id: "",
        free_service_qty: 1,
        birthday_days_before: 3,
        membership_tier: "",
        event_code: "",
        service_ids: [],
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        const t = setTimeout(() => applyFilters(1), 500);
        return () => clearTimeout(t);
    }, [search, type, active, sortBy, sortDirection]);

    const applyFilters = (page = 1) => {
        router.get(
            route("promotions.index"),
            {
                search,
                type: type === "all" ? "" : type,
                active: active === "all" ? "" : active,
                per_page: initial?.per_page || 10,
                sort_by: sortBy,
                sort_direction: sortDirection,
                page,
            },
            { preserveState: true, replace: true }
        );
    };

    const clearFilters = () => {
        setSearch("");
        setType("all");
        setActive("all");
        setSortBy("updated_at");
        setSortDirection("desc");
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setSortDirection("asc");
        }
    };

    const toggleRow = (id) =>
        setExpandedRows((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    const openCreate = () => {
        form.reset();
        setIsCreateOpen(true);
    };

    const openEdit = (promotion) => {
        setCurrent(promotion);
        form.setData({
            name: promotion.name,
            type: promotion.type,
            active: promotion.active,
            discount_percent: promotion.discount_percent || "",
            discount_amount: promotion.discount_amount || "",
            free_service_id: promotion.free_service_id || "",
            free_service_qty: promotion.free_service_qty || 1,
            birthday_days_before: promotion.birthday_days_before || 3,
            membership_tier: promotion.membership_tier || "",
            event_code: promotion.event_code || "",
            service_ids: promotion.services?.map((s) => s.id) || [],
        });
        setIsEditOpen(true);
    };

    const openDelete = (promotion) => {
        setCurrent(promotion);
        setIsDeleteOpen(true);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        form.post(route("promotions.store"), {
            onSuccess: () => {
                setIsCreateOpen(false);
                form.reset();
            },
        });
    };

    const handleEdit = (e) => {
        e.preventDefault();
        form.put(route("promotions.update", current.id), {
            onSuccess: () => {
                setIsEditOpen(false);
                setCurrent(null);
            },
        });
    };

    const handleDelete = () => {
        router.delete(route("promotions.destroy", current.id), {
            onSuccess: () => setIsDeleteOpen(false),
        });
    };

    const toggleServiceId = (f, id) => {
        const currentIds = f.data.service_ids || [];
        const newIds = currentIds.includes(id)
            ? currentIds.filter((i) => i !== id)
            : [...currentIds, id];
        f.setData("service_ids", newIds);
    };

    const buildPaginationUrl = (url) => {
        if (!url) return null;
        const u = new URL(url);
        const params = new URLSearchParams(u.search);
        params.set("search", search);
        params.set("type", type === "all" ? "" : type);
        params.set("active", active === "all" ? "" : active);
        params.set("sort_by", sortBy);
        params.set("sort_direction", sortDirection);
        return `${u.pathname}?${params.toString()}`;
    };

    // ===== Helpers =====
    const formatDate = fmtDate;
    const formatDateTime = fmtDateTime;

    return (
        <div className="container mx-auto px-4">
            <PromotionHeader onAdd={openCreate} stats={stats} />
            <Card>
                <CardContent>
                    <PromotionFilters
                        search={search}
                        setSearch={setSearch}
                        type={type}
                        setType={setType}
                        active={active}
                        setActive={setActive}
                        clearFilters={clearFilters}
                    />

                    <PromotionsTable
                        promotions={promotions.data}
                        expandedRows={expandedRows}
                        onToggle={toggleRow}
                        onEdit={openEdit}
                        onDelete={openDelete}
                        handleSort={handleSort}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        formatDate={formatDate}
                        formatDateTime={formatDateTime}
                    />

                    <Pagination
                        paginationData={promotions}
                        buildPaginationUrl={buildPaginationUrl}
                        router={router}
                    />
                </CardContent>
            </Card>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[720px]">
                    <DialogHeader>
                        <DialogTitle>New Promotion</DialogTitle>
                        <DialogDescription>
                            Simple rule: Birthday, Event, or Membership
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <PromotionForm
                            form={form}
                            services={services}
                            toggleServiceId={toggleServiceId}
                        />
                        <DialogFooter className="mt-4">
                            <Button type="submit" disabled={form.processing}>
                                Create
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[720px]">
                    <DialogHeader>
                        <DialogTitle>Edit Promotion</DialogTitle>
                        <DialogDescription>
                            Update rule and eligible services
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit}>
                        <PromotionForm
                            form={form}
                            services={services}
                            toggleServiceId={toggleServiceId}
                        />
                        <DialogFooter className="mt-4">
                            <Button type="submit" disabled={form.processing}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeletePromotionModal
                isOpen={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={handleDelete}
                promotion={current}
            />
        </div>
    );
}

Promotions.layout = (page) => <AuthenticatedLayout children={page} />;
