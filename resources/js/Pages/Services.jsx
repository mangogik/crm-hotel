import { useState, useEffect } from "react";
import { usePage, useForm, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import AuthenticatedLayout from "../Layouts/AuthenticatedLayout";
import { Badge } from "@/components/ui/badge";

// Import komponen yang sudah ada
import ServiceHeader from "../components/services/ServiceHeader";
import ServiceFilters from "../components/services/ServiceFilters";
import ServicesTable from "../components/services/ServicesTable";
import ServiceForm from "../components/services/ServiceForm";
import DeleteServiceModal from "../components/services/DeleteServiceModal";
import Pagination from "../components/services/Pagination";

// Import komponen insight baru
import ServiceHighlightCard from "../components/services/insights/ServiceHighlightCard";
import RankTableCard from "../components/services/insights/RankTableCard";

export default function Services() {
    // Menambahkan `insights` dari props
    const { services, filters, flash, insights } = usePage().props;

    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [selectedType, setSelectedType] = useState(filters.type || "all");
    const [selectedFulfillment, setSelectedFulfillment] = useState(
        filters.fulfillment_type || "all"
    );
    const [sortBy, setSortBy] = useState(filters.sort_by || "created_at");
    const [sortDirection, setSortDirection] = useState(
        filters.sort_direction || "desc"
    );
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [expandedRows, setExpandedRows] = useState([]);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: "",
            description: "",
            type: "fixed",
            fulfillment_type: "direct",
            price: "",
            unit_name: "",
            options: [{ name: "", price: "" }],
        });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        const timer = setTimeout(() => applyFilters(), 500);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedType, selectedFulfillment, sortBy, sortDirection]);

    const applyFilters = (page = 1) => {
        router.get(
            route("services.index"),
            {
                search: searchTerm,
                type: selectedType === "all" ? "" : selectedType,
                fulfillment_type:
                    selectedFulfillment === "all" ? "" : selectedFulfillment,
                sort_by: sortBy,
                sort_direction: sortDirection,
                page,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSort = (field) => {
        setSortBy(field);
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    };

    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsCreateModalOpen(true);
    };

    const openEditModal = (service) => {
        setData({
            name: service.name,
            description: service.description || "",
            type: service.type,
            fulfillment_type: service.fulfillment_type,
            price: service.price || "",
            unit_name: service.unit_name || "",
            options:
                service.options && service.options.length > 0
                    ? service.options
                    : [{ name: "", price: "" }],
        });
        clearErrors();
        setCurrentService(service);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (service) => {
        setCurrentService(service);
        setIsDeleteModalOpen(true);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        post(route("services.store"), {
            onSuccess: () => setIsCreateModalOpen(false),
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        put(route("services.update", currentService.id), {
            onSuccess: () => setIsEditModalOpen(false),
        });
    };

    const handleDelete = () => {
        router.delete(route("services.destroy", currentService.id), {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedType("all");
        setSelectedFulfillment("all");
        setSortBy("created_at");
        setSortDirection("desc");
    };

    // --- FUNGSI HELPER YANG DIPERLUKAN TABEL (DIKEMBALIKAN) ---
    const formatPrice = (price) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price || 0);

    const toggleRow = (id) =>
        setExpandedRows((prev) =>
            prev.includes(id)
                ? prev.filter((rowId) => rowId !== id)
                : [...prev, id]
        );

    const getTypeBadge = (type, unitName) => {
        let variant = "outline";
        let label = type;

        switch (type) {
            case "fixed":
                variant = "success";
                label = "Fixed";
                break;
            case "per_unit":
                variant = "info";
                label = `Per Unit ${unitName ? `(${unitName})` : ""}`;
                break;
            case "selectable":
                variant = "warning";
                label = "Selectable";
                break;
            default:
                label = type;
        }

        return (
            <Badge
                variant={variant}
                className="capitalize px-2 py-1 text-xs font-medium"
            >
                {label}
            </Badge>
        );
    };

    const getFulfillmentBadge = (fulfillment) => {
        let variant = "outline";
        let label = fulfillment;

        switch (fulfillment) {
            case "direct":
                variant = "secondary";
                label = "Direct";
                break;
            case "staff_assisted":
                variant = "default";
                label = "Staff Assisted";
                break;
            default:
                label = fulfillment;
        }

        return (
            <Badge
                variant={variant}
                className="capitalize px-2 py-1 text-xs font-medium"
            >
                {label}
            </Badge>
        );
    };

    // Form options handlers
    const addOption = () =>
        setData("options", [...data.options, { name: "", price: "" }]);
    const removeOption = (index) => {
        if (data.options.length > 1) {
            setData(
                "options",
                data.options.filter((_, i) => i !== index)
            );
        }
    };
    const updateOption = (index, field, value) => {
        const newOptions = [...data.options];
        newOptions[index][field] = value;
        setData("options", newOptions);
    };

    const buildPaginationUrl = (url) => {
        if (!url) return null;
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        params.set("search", searchTerm);
        params.set("type", selectedType === "all" ? "" : selectedType);
        params.set(
            "fulfillment_type",
            selectedFulfillment === "all" ? "" : selectedFulfillment
        );
        params.set("sort_by", sortBy);
        params.set("sort_direction", sortDirection);
        return `${urlObj.pathname}?${params.toString()}`;
    };

    return (
        <div className="container mx-auto py-2 px-4">
            <Card className="mb-8">
                <ServiceHeader onAddService={openCreateModal} />
                <CardContent>
                    <ServiceFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedType={selectedType}
                        setSelectedType={setSelectedType}
                        selectedFulfillment={selectedFulfillment}
                        setSelectedFulfillment={setSelectedFulfillment}
                        clearFilters={clearFilters}
                    />
                    <ServicesTable
                        services={services.data}
                        expandedRows={expandedRows}
                        toggleRow={toggleRow}
                        openEditModal={openEditModal}
                        openDeleteModal={openDeleteModal}
                        getTypeBadge={getTypeBadge}
                        getFulfillmentBadge={getFulfillmentBadge}
                        formatPrice={formatPrice}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        handleSort={handleSort}
                    />
                    <Pagination
                        paginationData={services}
                        buildPaginationUrl={buildPaginationUrl}
                        router={router}
                    />
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle className="text-2xl font-bold">Services Insights</CardTitle>
                    <CardDescription>Insights from your services data</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    <ServiceHighlightCard 
                        popularService={insights.mostPopular}
                        profitableService={insights.highestRevenue}
                        formatPrice={formatPrice}
                    />
                    <RankTableCard data={insights.topServices} />
                </CardContent>
            </Card>


            {/* Modals */}
            <Dialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            >
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Create New Service</DialogTitle>
                        <DialogDescription>
                            Add a new service to your offerings
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <ServiceForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            addOption={addOption}
                            removeOption={removeOption}
                            updateOption={updateOption}
                        />
                        <DialogFooter className="mt-4">
                            <Button type="submit" disabled={processing}>
                                Create Service
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Service</DialogTitle>
                        <DialogDescription>
                            Update service information
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate}>
                        <ServiceForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            addOption={addOption}
                            removeOption={removeOption}
                            updateOption={updateOption}
                        />
                        <DialogFooter className="mt-4">
                            <Button type="submit" disabled={processing}>
                                Update Service
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteServiceModal
                isOpen={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                onConfirm={handleDelete}    
                service={currentService}
            />
        </div>
    );
}

Services.layout = (page) => <AuthenticatedLayout children={page} />;

