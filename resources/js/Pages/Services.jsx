import { useState, useEffect } from "react";
import { usePage, router, Link } from "@inertiajs/react"; // Import Link
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import AuthenticatedLayout from "../Layouts/AuthenticatedLayout";
import { Badge } from "@/components/ui/badge";

// Import komponen-komponen Anda
import ServiceFilters from "../components/services/ServiceFilters";
import ServicesTable from "../components/services/ServicesTable";
import DeleteServiceModal from "../components/services/DeleteServiceModal";
import Pagination from "../components/services/Pagination";
import ServiceHighlightCard from "../components/services/insights/ServiceHighlightCard";
import RankTableCard from "../components/services/insights/RankTableCard";
import ServiceImagesDialog from "../components/services/ServiceImagesDialog";
import ServiceCategoriesTable from "@/components/services/ServiceCategoriesTable";

export default function Services() {
    const { services, filters, flash, insights, filterOptions, categories } =
        usePage().props;

    // ===== FILTERS / SORT (TETAP ADA) =====
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [selectedType, setSelectedType] = useState(filters.type || "all");
    const [selectedFulfillment, setSelectedFulfillment] = useState(
        filters.fulfillment_type || "all"
    );
    const [selectedOfferingSession, setSelectedOfferingSession] = useState(
        filters.offering_session || "all"
    );
    const [selectedCategory, setSelectedCategory] = useState(
        filters.category_id || "all"
    );
    const [sortBy, setSortBy] = useState(filters.sort_by || "created_at");
    const [sortDirection, setSortDirection] = useState(
        filters.sort_direction || "desc"
    );

    // ===== MODALS (HANYA UNTUK DELETE & PREVIEW) =====
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // preview images modal (lazy fetch inside dialog)
    const [isImagesModalOpen, setIsImagesModalOpen] = useState(false);
    const [imagePreviewService, setImagePreviewService] = useState(null);

    // ===== TABLE / ROW STATE (TETAP ADA) =====
    const [currentService, setCurrentService] = useState(null);
    const [expandedRows, setExpandedRows] = useState([]);

    // ===== SEMUA STATE FORM & GAMBAR DIHAPUS =====
    // (useForm, loadingImagesForEdit, all image states, etc. DIHAPUS)

    // ===== FLASH TOAST (TETAP ADA) =====
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // ===== FILTER DEBOUNCE (TETAP ADA) =====
    useEffect(() => {
        const timer = setTimeout(() => applyFilters(), 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        searchTerm,
        selectedType,
        selectedFulfillment,
        selectedOfferingSession,
        selectedCategory,
        sortBy,
        sortDirection,
    ]);

    const applyFilters = (page = 1) => {
        router.get(
            route("services.index"),
            {
                search: searchTerm,
                type: selectedType === "all" ? "" : selectedType,
                fulfillment_type:
                    selectedFulfillment === "all" ? "" : selectedFulfillment,
                offering_session:
                    selectedOfferingSession === "all"
                        ? ""
                        : selectedOfferingSession,
                category_id: selectedCategory === "all" ? "" : selectedCategory,
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

    // ===== PREVIEW MODAL OPEN (TETAP ADA) =====
    const openImagesModal = (service) => {
        setImagePreviewService({
            id: service.id,
            name: service.name,
            type: service.type,
        });
        setIsImagesModalOpen(true);
    };

    // ===== SEMUA IMAGE HANDLERS (markDelete, removeNew, etc.) DIHAPUS =====

    // ===== SEMUA MODAL HANDLERS (openCreate, openEdit) DIHAPUS =====

    // ===== DELETE MODAL OPEN (TETAP ADA) =====
    const openDeleteModal = (service) => {
        setCurrentService(service);
        setIsDeleteModalOpen(true);
    };

    // ===== TABLE ROW EXPAND (TETAP ADA) =====
    const toggleRow = (id) =>
        setExpandedRows((prev) =>
            prev.includes(id)
                ? prev.filter((rowId) => rowId !== id)
                : [...prev, id]
        );

    // ===== SEMUA OPTION HANDLERS (add, remove, update) DIHAPUS =====

    // ===== FILTER RESET (TETAP ADA) =====
    const clearFilters = () => {
        setSearchTerm("");
        setSelectedType("all");
        setSelectedFulfillment("all");
        setSelectedOfferingSession("all");
        setSelectedCategory("all");
        setSortBy("created_at");
        setSortDirection("desc");
    };

    // ===== FORMAT BADGES (TETAP ADA) =====
    const formatPrice = (price) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price || 0);

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
            case "multiple_options":
                label = "Multi-Select";
                break;
            default:
                label = type;
        }

        const colorClasses = {
            fixed: "bg-blue-100 text-blue-800 border-blue-200",
            per_unit: "bg-emerald-100 text-emerald-800 border-emerald-200",
            selectable: "bg-violet-100 text-violet-800 border-violet-200",
            multiple_options:
                "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
            free: "bg-rose-100 text-rose-800 border-rose-200",
        };

        const badgeColor =
            colorClasses[type] || "bg-gray-100 text-gray-800 border-gray-200";

        return (
            <Badge
                className={`capitalize text-xs font-medium w-28 justify-center ${badgeColor}`}
                variant="outline"
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

        const colorClasses = {
            direct: "bg-slate-100 text-slate-800 border-slate-200",
            staff_assisted: "bg-amber-100 text-amber-800 border-amber-200",
        };

        const badgeColor =
            colorClasses[fulfillment] ||
            "bg-gray-100 text-gray-800 border-gray-200";

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
        let label = session ? session.replace("_", " ") : "N/A";
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
            case "free":
                label = "Free";
                break;
            default:
                label = session;
        }

        const colorClasses = {
            pre_checkin: "bg-indigo-100 text-indigo-800 border-indigo-200",
            post_checkin: "bg-green-100 text-green-800 border-green-200",
            pre_checkout: "bg-orange-100 text-orange-800 border-orange-200",
            free: "bg-rose-100 text-rose-800 border-rose-200",
        };

        const badgeColor =
            colorClasses[session] ||
            "bg-gray-100 text-gray-800 border-gray-200";

        return (
            <Badge
                className={`capitalize text-xs font-medium w-32 justify-center ${badgeColor}`}
                variant="outline"
            >
                {label}
            </Badge>
        );
    };

    // ===== PAGINATION (TETAP ADA) =====
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
        params.set(
            "category_id",
            selectedCategory === "all" ? "" : selectedCategory
        );
        params.set("sort_by", sortBy);
        params.set("sort_direction", sortDirection);
        return `${urlObj.pathname}?${params.toString()}`;
    };

    // ===== SEMUA FUNGSI SUBMIT (buildForm, handleCreate, handleUpdate) DIHAPUS =====

    // ===== SUBMIT DELETE (TETAP ADA) =====
    const handleDelete = () => {
        router.delete(route("services.destroy", currentService.id), {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    // ===== RENDER =====
    return (
        <div className="container mx-auto py-2 px-4">
            <Card className="mb-8">
                {/* ======================================================
                    PERUBAHAN PENTING 1: ServiceHeader
                    ======================================================

                    Komponen <ServiceHeader> Anda sebelumnya menerima prop 'onAddService'.
                    Karena kita tidak lagi membuka modal, Anda harus menggantinya 
                    dengan <Link> dari Inertia.

                    Ubah file `ServiceHeader.jsx` Anda untuk menerima <Link>
                    atau ganti saja panggilannya di sini menjadi tombol <Link> sederhana:

                */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">
                            Services Management
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Manage all services available for guests.
                        </p>
                    </div>
                    <Link href={route("services.create")}>
                        <Button>+ Add Service</Button>
                    </Link>
                </div>
                {/* ====================================================== */}

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
                        categories={categories || []}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        clearFilters={clearFilters}
                        filterOptions={filterOptions}
                    />

                    {/* ======================================================
                        PERUBAHAN PENTING 2: ServicesTable
                        ======================================================

                        Komponen <ServicesTable> Anda sebelumnya menerima prop 'openEditModal'.
                        Prop ini sekarang sudah dihapus.

                        Anda HARUS mengedit file `ServicesTable.jsx` Anda:
                        1. Cari tombol "Edit" di dalam tabel.
                        2. Hapus `onClick={() => openEditModal(service)}`.
                        3. Ganti tombol itu dengan komponen <Link> dari Inertia:
                           
                           <Link href={route('services.edit', service.id)}>
                               <Button variant="outline" size="sm">Edit</Button>
                           </Link>

                    ====================================================== */}
                    <ServicesTable
                        services={services.data}
                        expandedRows={expandedRows}
                        toggleRow={toggleRow}
                        // openEditModal={openEditModal} // <-- DIHAPUS
                        openDeleteModal={openDeleteModal}
                        openImagesModal={openImagesModal}
                        formatPrice={formatPrice}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        handleSort={handleSort}
                        getTypeBadge={getTypeBadge}
                        getFulfillmentBadge={getFulfillmentBadge}
                        getOfferingSessionBadge={getOfferingSessionBadge}
                    />

                    <Pagination
                        paginationData={services}
                        buildPaginationUrl={buildPaginationUrl}
                        router={router}
                    />
                </CardContent>
            </Card>
            <ServiceCategoriesTable categories={categories || []} />

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        Services Insights
                    </CardTitle>
                    <CardDescription>
                        Insights from your services data
                    </CardDescription>
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

            {/* MODAL CREATE DAN EDIT DIHAPUS DARI SINI */}

            {/* DELETE MODAL (TETAP ADA) */}
            <DeleteServiceModal
                isOpen={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                onConfirm={handleDelete}
                service={currentService}
            />

            {/* IMAGE PREVIEW MODAL (TETAP ADA) */}
            <ServiceImagesDialog
                open={isImagesModalOpen}
                onOpenChange={setIsImagesModalOpen}
                serviceMeta={imagePreviewService}
            />
        </div>
    );
}

Services.layout = (page) => <AuthenticatedLayout children={page} />;