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
import ServiceHeader from "../components/services/ServiceHeader";
import ServiceFilters from "../components/services/ServiceFilters";
import ServicesTable from "../components/services/ServicesTable";
import ServiceForm from "../components/services/ServiceForm";
import DeleteServiceModal from "../components/services/DeleteServiceModal";
import Pagination from "../components/services/Pagination";
import ServiceHighlightCard from "../components/services/insights/ServiceHighlightCard";
import RankTableCard from "../components/services/insights/RankTableCard";

export default function Services() {
    const { services, filters, flash, insights } = usePage().props;

    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [selectedType, setSelectedType] = useState(filters.type || "all");
    const [selectedFulfillment, setSelectedFulfillment] = useState(
        filters.fulfillment_type || "all"
    );

    const [selectedOfferingSession, setSelectedOfferingSession] = useState(
        filters.offering_session || "all"
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
            offering_session: "post_checkin", 
            price: "",
            unit_name: "",
            options: [{ name: "", price: "" }],
        });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // Added selectedOfferingSession to dependency array
    useEffect(() => {
        const timer = setTimeout(() => applyFilters(), 500);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedType, selectedFulfillment, selectedOfferingSession, sortBy, sortDirection]);

    const applyFilters = (page = 1) => {
        router.get(
            route("services.index"),
            {
                search: searchTerm,
                type: selectedType === "all" ? "" : selectedType,
                fulfillment_type:
                    selectedFulfillment === "all" ? "" : selectedFulfillment,
                offering_session:
                    selectedOfferingSession === "all" ? "" : selectedOfferingSession,
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
            offering_session: service.offering_session || "post_checkin",
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
        setSelectedOfferingSession("all"); // Reset new filter
        setSortBy("created_at");
        setSortDirection("desc");
    };

    // --- HELPER FUNCTIONS ---
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
    let label = type;

    switch (type) {
        case "fixed":
            label = "Fixed";
            break;
        case "per_unit":
            label = `Per Unit ${unitName ? `(${unitName})` : ""}`;
            break;
        case "selectable":
            label = "Select";
            break;
        default:
            label = type;
    }

    // Palet warna untuk tipe layanan
    const colorClasses = {
        fixed: "bg-blue-100 text-blue-800 border-blue-200",
        per_unit: "bg-emerald-100 text-emerald-800 border-emerald-200",
        selectable: "bg-violet-100 text-violet-800 border-violet-200",
    };

    const badgeColor = colorClasses[type] || "bg-gray-100 text-gray-800 border-gray-200";

    return (
        <Badge
            className={`capitalize text-xs font-medium w-28 justify-center ${badgeColor}`}
            variant="outline" // Tetap gunakan outline untuk border yang konsisten
        >
            {label}
        </Badge>
    );
};

const getFulfillmentBadge = (fulfillment) => {
    let label = fulfillment;

    switch (fulfillment) {
        case "direct":
            label = "Direct";
            break;
        case "staff_assisted":
            label = "Staff Assisted";
            break;
        default:
            label = fulfillment;
    }

    // Palet warna untuk tipe pemenuhan
    const colorClasses = {
        direct: "bg-slate-100 text-slate-800 border-slate-200",
        staff_assisted: "bg-amber-100 text-amber-800 border-amber-200",
    };

    const badgeColor = colorClasses[fulfillment] || "bg-gray-100 text-gray-800 border-gray-200";

    return (
        <Badge
            className={`capitalize text-xs font-medium w-32 justify-center ${badgeColor}`}
            variant="outline"
        >
            {label}
        </Badge>
    );
};

const getOfferingSessionBadge = (session) => {
    let label = session ? session.replace('_', ' ') : 'N/A';

    switch (session) {
        case "pre_checkin":
            label = "Pre Check-in";
            break;
        case "post_checkin":
            label = "Post Check-in";
            break;
        case "pre_checkout":
            label = "Pre Checkout";
            break;
        default:
            label = session;
    }

    // Palet warna untuk sesi penawaran
    const colorClasses = {
        pre_checkin: "bg-indigo-100 text-indigo-800 border-indigo-200",
        post_checkin: "bg-green-100 text-green-800 border-green-200",
        pre_checkout: "bg-orange-100 text-orange-800 border-orange-200",
    };

    const badgeColor = colorClasses[session] || "bg-gray-100 text-gray-800 border-gray-200";

    return (
        <Badge
            className={`capitalize text-xs font-medium w-32 justify-center ${badgeColor}`}
            variant="outline"
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
        params.set( 
            "offering_session",
            selectedOfferingSession === "all" ? "" : selectedOfferingSession
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
                        selectedOfferingSession={selectedOfferingSession}
                        setSelectedOfferingSession={setSelectedOfferingSession}
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
                        getOfferingSessionBadge={getOfferingSessionBadge}
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