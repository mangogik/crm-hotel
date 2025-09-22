import { useState, useEffect } from "react";
import { usePage, useForm, router } from "@inertiajs/react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import AuthenticatedLayout from "../Layouts/AuthenticatedLayout";

// Import newly created components
import OrderHeader from "../components/orders/OrderHeader";
import OrderFilters from "../components/orders/OrderFilters";
import OrdersTable from "../components/orders/OrdersTable";
import DeleteOrderModal from "../components/orders/DeleteOrderModal";
import Pagination from "../components/orders/Pagination";
import OrderForm from "../components/orders/OrderForm";

export default function Orders() {
    const {
        orders: ordersData,
        customers,
        services,
        filters: initialFilters,
        flash,
    } = usePage().props;
    const countries = [
        ...new Set(
            customers
                .map((customer) => customer.passport_country)
                .filter(Boolean)
        ),
    ];
    const [searchTerm, setSearchTerm] = useState(initialFilters.search || "");
    const [selectedStatus, setSelectedStatus] = useState(
        initialFilters.status || "all"
    );
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
        initialFilters.payment_method || "all"
    );
    const [selectedCountry, setSelectedCountry] = useState(
        initialFilters.country || "all"
    );
    const [sortBy, setSortBy] = useState(
        initialFilters.sort_by || "created_at"
    );
    const [sortDirection, setSortDirection] = useState(
        initialFilters.sort_direction || "desc"
    );

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [expandedRows, setExpandedRows] = useState([]);
    const [orderServices, setOrderServices] = useState([
        { id: "", quantity: 1, details: {} },
    ]);

    const isPending = currentOrder?.status === "pending";

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            customer_id: "",
            services: [{ id: "", quantity: 1, details: {} }],
            status: "pending",
            payment_method: "cash",
        });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        const timer = setTimeout(applyFilters, 500);
        return () => clearTimeout(timer);
    }, [
        searchTerm,
        selectedStatus,
        selectedPaymentMethod,
        selectedCountry,
        sortBy,
        sortDirection,
    ]);

    const applyFilters = (page = 1) => {
        router.get(
            route("orders.index"),
            {
                search: searchTerm,
                status: selectedStatus === "all" ? "" : selectedStatus,
                country: selectedCountry === "all" ? "" : selectedCountry,
                payment_method:
                    selectedPaymentMethod === "all"
                        ? ""
                        : selectedPaymentMethod,
                sort_by: sortBy,
                sort_direction: sortDirection,
                per_page: initialFilters.per_page,
                page,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortDirection("asc");
        }
    };

    const openCreateModal = () => {
        reset();
        clearErrors();
        setOrderServices([{ id: "", quantity: 1, details: {} }]);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (order) => {
        const servicesData = order.services.map((service) => ({
            id: service.id,
            quantity: service.pivot.quantity,
            details: JSON.parse(service.pivot.details || "{}"),
        }));
        setData({
            customer_id: order.customer_id,
            services: servicesData,
            status: order.status,
            payment_method: order.payment_method,
        });
        setOrderServices(servicesData);
        clearErrors();
        setCurrentOrder(order);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (order) => {
        setCurrentOrder(order);
        setIsDeleteModalOpen(true);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        post(route("orders.store"), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
            },
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        put(route("orders.update", currentOrder.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                reset();
            },
        });
    };

    const handleDelete = () => {
        router.delete(route("orders.destroy", currentOrder.id), {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedStatus("all");
        setSelectedPaymentMethod("all");
        setSelectedCountry("all"); // Reset country filter
        setSortBy("created_at");
        setSortDirection("desc");
    };

    // --- Helper & Dynamic UI Functions ---
    const formatPrice = (price) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(price || 0);
    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString();
    const getStatusBadge = (status) => {
        let variant = "secondary"; // default

        switch (status) {
            case "pending":
                variant = "warning"; // kuning
                break;
            case "paid":
                variant = "success"; // hijau
                break;
            case "cancelled":
                variant = "destructive"; // merah
                break;
            default:
                variant = "outline";
        }

        return (
            <Badge
                variant={variant}
                className="capitalize px-2 py-1 text-xs font-medium"
            >
                {status}
            </Badge>
        );
    };
    const getPaymentBadge = (method) => {
        let variant = "secondary";

        switch (method) {
            case "cash":
                variant = "purple"; // hijau
                break;
            case "online":
                variant = "info"; // biru
                break;
            default:
                variant = "outline";
        }

        return (
            <Badge
                variant={variant}
                className="capitalize px-2 py-1 text-xs font-medium"
            >
                {method}
            </Badge>
        );
    };
    const toggleRow = (id) =>
        setExpandedRows((prev) =>
            prev.includes(id)
                ? prev.filter((rowId) => rowId !== id)
                : [...prev, id]
        );

    // --- Service Form Handlers ---
    const addService = () => {
        const newServices = [
            ...orderServices,
            { id: "", quantity: 1, details: {} },
        ];
        setOrderServices(newServices);
        setData("services", newServices);
    };
    const removeService = (index) => {
        if (orderServices.length <= 1) return;
        const newServices = orderServices.filter((_, i) => i !== index);
        setOrderServices(newServices);
        setData("services", newServices);
    };
    const updateService = (index, field, value) => {
        const newServices = [...orderServices];
        newServices[index] = { ...newServices[index], [field]: value };
        if (field === "id") newServices[index].details = {}; // Reset details on service change
        setOrderServices(newServices);
        setData("services", newServices);
    };
    const updateServiceDetail = (index, detailField, value) => {
        const newServices = [...orderServices];
        newServices[index].details = {
            ...newServices[index].details,
            [detailField]: value,
        };
        setOrderServices(newServices);
        setData("services", newServices);
    };

    const buildPaginationUrl = (url) => {
        if (!url) return null;
        const urlObj = new URL(url);
        // This ensures existing query params from inertia links are preserved and new ones are added
        const params = new URLSearchParams(urlObj.search);
        params.set("search", searchTerm);
        params.set("status", selectedStatus === "all" ? "" : selectedStatus);
        params.set(
            "payment_method",
            selectedPaymentMethod === "all" ? "" : selectedPaymentMethod
        );
        params.set("sort_by", sortBy);
        params.set("sort_direction", sortDirection);
        return `${urlObj.pathname}?${params.toString()}`;
    };

    return (
        <div className="container mx-auto py-2 px-4">
            <Card className="mb-8">
                <OrderHeader onAddOrder={openCreateModal} />
                <CardContent>
                    <OrderFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                        selectedPaymentMethod={selectedPaymentMethod}
                        setSelectedPaymentMethod={setSelectedPaymentMethod}
                        selectedCountry={selectedCountry}
                        setSelectedCountry={setSelectedCountry}
                        clearFilters={clearFilters}
                        countries={countries}
                    />

                    <OrdersTable
                        orders={ordersData}
                        expandedRows={expandedRows}
                        toggleRow={toggleRow}
                        openEditModal={openEditModal}
                        openDeleteModal={openDeleteModal}
                        getStatusBadge={getStatusBadge}
                        getPaymentBadge={getPaymentBadge}
                        formatPrice={formatPrice}
                        formatDate={formatDate}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        handleSort={handleSort}
                    />

                    <Pagination
                        paginationData={ordersData}
                        buildPaginationUrl={buildPaginationUrl}
                    />
                </CardContent>
            </Card>

            {/* Create Order Modal */}
            <Dialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            >
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Create New Order</DialogTitle>
                        <DialogDescription>
                            Add a new customer order
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <OrderForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            customers={customers}
                            services={services}
                            orderServices={orderServices}
                            updateService={updateService}
                            updateServiceDetail={updateServiceDetail}
                            addService={addService}
                            removeService={removeService}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={processing}>
                                Create Order
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Order Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Edit Order Status</DialogTitle>
                        <DialogDescription>
                            Only status and payment method can be changed.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate}>
                        <OrderForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            customers={customers}
                            services={services}
                            orderServices={orderServices}
                            updateService={updateService}
                            updateServiceDetail={updateServiceDetail}
                            addService={addService}
                            removeService={removeService}
                            isPending={isPending}
                            isStatusUpdateOnly={true}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={processing}>
                                Update Order
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Order Modal */}
            <DeleteOrderModal
                isOpen={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                onConfirm={handleDelete}
                order={currentOrder}
            />
        </div>
    );
}

Orders.layout = (page) => <AuthenticatedLayout children={page} />;
