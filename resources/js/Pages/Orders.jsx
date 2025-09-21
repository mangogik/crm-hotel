import { useState, useEffect } from "react";
import { usePage, useForm, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Pencil,
    Trash2,
    Plus,
    Search,
    Filter,
    X,
    ArrowUpDown,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Orders() {
    const {
        orders: ordersData = { data: [] },
        customers,
        services,
        filters: filtersData = {},
        flash,
    } = usePage().props;
    const [searchTerm, setSearchTerm] = useState(filtersData.search || "");
    const [selectedStatus, setSelectedStatus] = useState(
        filtersData.status || "all"
    );
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
        filtersData.payment_method || "all"
    );
    const [sortBy, setSortBy] = useState(filtersData.sort_by || "created_at");
    const [sortDirection, setSortDirection] = useState(
        filtersData.sort_direction || "desc"
    );
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [currentPage, setCurrentPage] = useState(filtersData.page || 1);
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

    // Show flash messages with safety check
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters();
        }, 500);
        return () => clearTimeout(timer);
    }, [
        searchTerm,
        selectedStatus,
        selectedPaymentMethod,
        sortBy,
        sortDirection,
        currentPage,
    ]);

    const applyFilters = () => {
        router.get(
            route("orders.index"),
            {
                search: searchTerm,
                status: selectedStatus === "all" ? "" : selectedStatus,
                payment_method:
                    selectedPaymentMethod === "all"
                        ? ""
                        : selectedPaymentMethod,
                sort_by: sortBy,
                sort_direction: sortDirection,
                per_page: filtersData.per_page,
                page: currentPage,
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
        setData({
            customer_id: "",
            services: [{ id: "", quantity: 1, details: {} }],
            status: "pending",
            payment_method: "cash",
        });
        setOrderServices([{ id: "", quantity: 1, details: {} }]);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (order) => {
        // Prepare services data for the form
        const servicesData = order.services
            ? order.services.map((service) => ({
                  id: service.id,
                  quantity: service.pivot.quantity,
                  details: JSON.parse(service.pivot.details || "{}"),
              }))
            : [];

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
            onError: (errors) => {
                console.error(errors);
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
            onError: (errors) => {
                console.error(errors);
            },
        });
    };

    const handleDelete = () => {
        router.delete(route("orders.destroy", currentOrder.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
            },
            onError: (errors) => {
                console.error(errors);
            },
        });
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedStatus("all");
        setSelectedPaymentMethod("all");
        setSortBy("created_at");
        setSortDirection("desc");
        setCurrentPage(1);
    };

    const formatPrice = (price) => {
        if (!price && price !== 0) return "N/A";
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(price);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusBadge = (status) => {
        const variants = {
            pending: "secondary",
            paid: "default",
            cancelled: "destructive",
        };
        return (
            <Badge variant={variants[status] || "secondary"}>{status}</Badge>
        );
    };

    const getPaymentBadge = (method) => {
        const variants = {
            cash: "default",
            online: "outline",
        };
        return (
            <Badge variant={variants[method] || "secondary"}>{method}</Badge>
        );
    };

    const toggleRow = (id) => {
        if (expandedRows.includes(id)) {
            setExpandedRows(expandedRows.filter((rowId) => rowId !== id));
        } else {
            setExpandedRows([...expandedRows, id]);
        }
    };

    const addService = () => {
        const newServices = [
            ...orderServices,
            { id: "", quantity: 1, details: {} },
        ];
        setOrderServices(newServices);
        setData("services", newServices);
    };

    const removeService = (index) => {
        if (orderServices.length > 1) {
            const newServices = [...orderServices];
            newServices.splice(index, 1);
            setOrderServices(newServices);
            setData("services", newServices);
        }
    };

    const updateService = (index, field, value) => {
        const newServices = [...orderServices];
        newServices[index][field] = value;

        // Reset details when service changes
        if (field === "id") {
            const service = services.find((s) => s.id === value);
            if (service) {
                newServices[index].details = {};
                if (service.type === "per_unit") {
                    newServices[index].details.weight = 0;
                }
            }
        }

        setOrderServices(newServices);
        setData("services", newServices);
    };

    const updateServiceDetail = (index, detailField, value) => {
        const newServices = [...orderServices];
        newServices[index].details[detailField] = value;
        setOrderServices(newServices);
        setData("services", newServices);
    };

    const SortableHeader = ({ field, children }) => (
        <TableHead className="cursor-pointer" onClick={() => handleSort(field)}>
            <div className="flex items-center space-x-1">
                <span>{children}</span>
                {sortBy === field && (
                    <ArrowUpDown
                        className={`h-3 w-3 ${
                            sortDirection === "asc" ? "rotate-180" : ""
                        }`}
                    />
                )}
            </div>
        </TableHead>
    );

    // Build URL for pagination with current filters
    const buildPaginationUrl = (url) => {
        if (!url) return null;

        const urlObj = new URL(url, window.location.origin);

        // Add all current filters to the URL
        urlObj.searchParams.set("search", searchTerm);
        urlObj.searchParams.set(
            "status",
            selectedStatus === "all" ? "" : selectedStatus
        );
        urlObj.searchParams.set(
            "payment_method",
            selectedPaymentMethod === "all" ? "" : selectedPaymentMethod
        );
        urlObj.searchParams.set("sort_by", sortBy);
        urlObj.searchParams.set("sort_direction", sortDirection);
        urlObj.searchParams.set("per_page", filtersData.per_page);

        return urlObj.pathname + "?" + urlObj.searchParams.toString();
    };

    return (
        <div className="container mx-auto py-2 px-4">
            <Card className="mb-8">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl font-bold">
                                Orders
                            </CardTitle>
                            <CardDescription>
                                Manage customer orders
                            </CardDescription>
                        </div>
                        <Dialog
                            open={isCreateModalOpen}
                            onOpenChange={setIsCreateModalOpen}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    onClick={openCreateModal}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" /> Add Order
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[700px]">
                                <DialogHeader>
                                    <DialogTitle>Create New Order</DialogTitle>
                                    <DialogDescription>
                                        Add a new customer order
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreate}>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="customer_id"
                                                className="text-right"
                                            >
                                                Customer *
                                            </Label>
                                            <Select
                                                value={data.customer_id}
                                                onValueChange={(value) =>
                                                    setData(
                                                        "customer_id",
                                                        value
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customers.map(
                                                        (customer) => (
                                                            <SelectItem
                                                                key={
                                                                    customer.id
                                                                }
                                                                value={customer.id.toString()}
                                                            >
                                                                {customer.name}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {errors.customer_id && (
                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                    {errors.customer_id}
                                                </p>
                                            )}
                                        </div>
                                        <fieldset disabled={!isPending}>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label className="text-right">
                                                        Services *
                                                    </Label>
                                                    <div className="col-span-3 space-y-2">
                                                        {orderServices.map(
                                                            (
                                                                service,
                                                                index
                                                            ) => (
                                                                <div
                                                                    key={index}
                                                                    className="border rounded p-3 space-y-3"
                                                                >
                                                                    <div className="flex justify-between items-center">
                                                                        <h4 className="font-medium">
                                                                            Service
                                                                            #
                                                                            {index +
                                                                                1}
                                                                        </h4>
                                                                        {orderServices.length >
                                                                            1 && (
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    removeService(
                                                                                        index
                                                                                    )
                                                                                }
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                    </div>

                                                                    <div className="grid grid-cols-12 gap-2">
                                                                        <div className="col-span-7">
                                                                            <Select
                                                                                value={
                                                                                    service.id
                                                                                }
                                                                                onValueChange={(
                                                                                    value
                                                                                ) =>
                                                                                    updateService(
                                                                                        index,
                                                                                        "id",
                                                                                        value
                                                                                    )
                                                                                }
                                                                            >
                                                                                <SelectTrigger>
                                                                                    <SelectValue placeholder="Select service" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {services.map(
                                                                                        (
                                                                                            s
                                                                                        ) => (
                                                                                            <SelectItem
                                                                                                key={
                                                                                                    s.id
                                                                                                }
                                                                                                value={s.id.toString()}
                                                                                            >
                                                                                                {
                                                                                                    s.name
                                                                                                }
                                                                                            </SelectItem>
                                                                                        )
                                                                                    )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="col-span-5">
                                                                            <Input
                                                                                type="number"
                                                                                min="1"
                                                                                placeholder="Quantity"
                                                                                value={
                                                                                    service.quantity
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) =>
                                                                                    updateService(
                                                                                        index,
                                                                                        "quantity",
                                                                                        parseInt(
                                                                                            e
                                                                                                .target
                                                                                                .value
                                                                                        ) ||
                                                                                            1
                                                                                    )
                                                                                }
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {service.id &&
                                                                        (() => {
                                                                            const selectedService =
                                                                                services.find(
                                                                                    (
                                                                                        s
                                                                                    ) =>
                                                                                        s.id ===
                                                                                        parseInt(
                                                                                            service.id
                                                                                        )
                                                                                );
                                                                            if (
                                                                                !selectedService
                                                                            )
                                                                                return null;

                                                                            if (
                                                                                selectedService.type ===
                                                                                "selectable"
                                                                            ) {
                                                                                return (
                                                                                    <div className="grid grid-cols-12 gap-2">
                                                                                        <div className="col-span-12">
                                                                                            <Select
                                                                                                value={
                                                                                                    service
                                                                                                        .details
                                                                                                        .package ||
                                                                                                    ""
                                                                                                }
                                                                                                onValueChange={(
                                                                                                    value
                                                                                                ) =>
                                                                                                    updateServiceDetail(
                                                                                                        index,
                                                                                                        "package",
                                                                                                        value
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                <SelectTrigger>
                                                                                                    <SelectValue placeholder="Select option" />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    {selectedService.options &&
                                                                                                        selectedService.options.map(
                                                                                                            (
                                                                                                                option,
                                                                                                                optIndex
                                                                                                            ) => (
                                                                                                                <SelectItem
                                                                                                                    key={
                                                                                                                        optIndex
                                                                                                                    }
                                                                                                                    value={
                                                                                                                        option.name
                                                                                                                    }
                                                                                                                >
                                                                                                                    {
                                                                                                                        option.name
                                                                                                                    }{" "}
                                                                                                                    -{" "}
                                                                                                                    {formatPrice(
                                                                                                                        option.price
                                                                                                                    )}
                                                                                                                </SelectItem>
                                                                                                            )
                                                                                                        )}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            }

                                                                            if (
                                                                                selectedService.type ===
                                                                                "per_unit"
                                                                            ) {
                                                                                return (
                                                                                    <div className="grid grid-cols-12 gap-2">
                                                                                        <div className="col-span-12">
                                                                                            <Input
                                                                                                type="number"
                                                                                                min="0"
                                                                                                step="0.01"
                                                                                                placeholder="Weight/Unit"
                                                                                                value={
                                                                                                    service
                                                                                                        .details
                                                                                                        .weight ||
                                                                                                    ""
                                                                                                }
                                                                                                onChange={(
                                                                                                    e
                                                                                                ) =>
                                                                                                    updateServiceDetail(
                                                                                                        index,
                                                                                                        "weight",
                                                                                                        parseFloat(
                                                                                                            e
                                                                                                                .target
                                                                                                                .value
                                                                                                        ) ||
                                                                                                            0
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            }

                                                                            return null;
                                                                        })()}
                                                                </div>
                                                            )
                                                        )}

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={addService}
                                                            className="mt-2"
                                                            disabled={
                                                                !isPending
                                                            }
                                                        >
                                                            <Plus className="h-4 w-4 mr-1" />{" "}
                                                            Add Service
                                                        </Button>

                                                        {errors.services && (
                                                            <p className="text-red-500 text-sm mt-1">
                                                                {
                                                                    errors.services
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </fieldset>

                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="status"
                                                className="text-right"
                                            >
                                                Status *
                                            </Label>
                                            <Select
                                                value={data.status}
                                                onValueChange={(value) =>
                                                    setData("status", value)
                                                }
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">
                                                        Pending
                                                    </SelectItem>
                                                    <SelectItem value="paid">
                                                        Paid
                                                    </SelectItem>
                                                    <SelectItem value="cancelled">
                                                        Cancelled
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.status && (
                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                    {errors.status}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="payment_method"
                                                className="text-right"
                                            >
                                                Payment Method *
                                            </Label>
                                            <Select
                                                value={data.payment_method}
                                                onValueChange={(value) =>
                                                    setData(
                                                        "payment_method",
                                                        value
                                                    )
                                                }
                                                disabled={!isPending}
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select payment method" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cash">
                                                        Cash
                                                    </SelectItem>
                                                    <SelectItem value="online">
                                                        Online
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.payment_method && (
                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                    {errors.payment_method}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Create Order
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search orders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select
                                value={selectedStatus}
                                onValueChange={setSelectedStatus}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Statuses
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="cancelled">
                                        Cancelled
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={selectedPaymentMethod}
                                onValueChange={setSelectedPaymentMethod}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Payment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Payments
                                    </SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="online">
                                        Online
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="flex items-center gap-2"
                            >
                                <X className="h-4 w-4" /> Clear Sort & Filters
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-8"></TableHead>
                                    <SortableHeader field="customer.name">
                                        Customer
                                    </SortableHeader>
                                    <TableHead>Country</TableHead>
                                    <SortableHeader field="status">
                                        Status
                                    </SortableHeader>
                                    <SortableHeader field="payment_method">
                                        Payment
                                    </SortableHeader>
                                    <SortableHeader field="total_price">
                                        Total
                                    </SortableHeader>
                                    <SortableHeader field="created_at">
                                        Date
                                    </SortableHeader>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ordersData.length > 0 ? (
                                    ordersData.map((order) => (
                                        <>
                                            <TableRow
                                                key={order.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() =>
                                                    toggleRow(order.id)
                                                }
                                            >
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        {expandedRows.includes(
                                                            order.id
                                                        ) ? (
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
                                                    {order.customer
                                                        .passport_country ? (
                                                        <Badge variant="outline">
                                                            {
                                                                order.customer
                                                                    .passport_country
                                                            }
                                                        </Badge>
                                                    ) : (
                                                        "N/A"
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(
                                                        order.status
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {getPaymentBadge(
                                                        order.payment_method
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {formatPrice(
                                                        order.total_price
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(
                                                        order.created_at
                                                    )}
                                                </TableCell>
                                                <TableCell
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <div className="flex space-x-2">
                                                        <Dialog
                                                            open={
                                                                isEditModalOpen &&
                                                                currentOrder?.id ===
                                                                    order.id
                                                            }
                                                            onOpenChange={(
                                                                open
                                                            ) => {
                                                                if (!open)
                                                                    setIsEditModalOpen(
                                                                        false
                                                                    );
                                                            }}
                                                        >
                                                            <DialogTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        openEditModal(
                                                                            order
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-[700px]">
                                                                <DialogHeader>
                                                                    <DialogTitle>
                                                                        Edit
                                                                        Order
                                                                    </DialogTitle>
                                                                    <DialogDescription>
                                                                        Update
                                                                        order
                                                                        information
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <form
                                                                    onSubmit={
                                                                        handleUpdate
                                                                    }
                                                                >
                                                                    <div className="grid gap-4 py-4">
                                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                                            <Label
                                                                                htmlFor="customer_id"
                                                                                className="text-right"
                                                                            >
                                                                                Customer
                                                                                *
                                                                            </Label>
                                                                            <Select
                                                                                value={
                                                                                    data.customer_id
                                                                                }
                                                                                onValueChange={(
                                                                                    value
                                                                                ) =>
                                                                                    setData(
                                                                                        "customer_id",
                                                                                        value
                                                                                    )
                                                                                }
                                                                            >
                                                                                <SelectTrigger className="col-span-3">
                                                                                    <SelectValue placeholder="Select customer" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {customers.map(
                                                                                        (
                                                                                            customer
                                                                                        ) => (
                                                                                            <SelectItem
                                                                                                key={
                                                                                                    customer.id
                                                                                                }
                                                                                                value={customer.id.toString()}
                                                                                            >
                                                                                                {
                                                                                                    customer.name
                                                                                                }
                                                                                            </SelectItem>
                                                                                        )
                                                                                    )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                            {errors.customer_id && (
                                                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                                                    {
                                                                                        errors.customer_id
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>

                                                                        <div className="space-y-4">
                                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                                <Label className="text-right">
                                                                                    Services
                                                                                    *
                                                                                </Label>
                                                                                <div className="col-span-3 space-y-2">
                                                                                    {(
                                                                                        orderServices ||
                                                                                        []
                                                                                    ).map(
                                                                                        (
                                                                                            service,
                                                                                            index
                                                                                        ) => (
                                                                                            <div
                                                                                                key={
                                                                                                    index
                                                                                                }
                                                                                                className="border rounded p-3 space-y-3"
                                                                                            >
                                                                                                <div className="flex justify-between items-center">
                                                                                                    <h4 className="font-medium">
                                                                                                        Service
                                                                                                        #
                                                                                                        {index +
                                                                                                            1}
                                                                                                    </h4>
                                                                                                    {(
                                                                                                        orderServices ||
                                                                                                        []
                                                                                                    )
                                                                                                        .length >
                                                                                                        1 && (
                                                                                                        <Button
                                                                                                            type="button"
                                                                                                            variant="outline"
                                                                                                            size="sm"
                                                                                                            onClick={() =>
                                                                                                                removeService(
                                                                                                                    index
                                                                                                                )
                                                                                                            }
                                                                                                        >
                                                                                                            <X className="h-4 w-4" />
                                                                                                        </Button>
                                                                                                    )}
                                                                                                </div>

                                                                                                <div className="grid grid-cols-12 gap-2">
                                                                                                    <div className="col-span-7">
                                                                                                        <Select
                                                                                                            value={
                                                                                                                service.id
                                                                                                            }
                                                                                                            onValueChange={(
                                                                                                                value
                                                                                                            ) =>
                                                                                                                updateService(
                                                                                                                    index,
                                                                                                                    "id",
                                                                                                                    value
                                                                                                                )
                                                                                                            }
                                                                                                        >
                                                                                                            <SelectTrigger>
                                                                                                                <SelectValue placeholder="Select service" />
                                                                                                            </SelectTrigger>
                                                                                                            <SelectContent>
                                                                                                                {services.map(
                                                                                                                    (
                                                                                                                        s
                                                                                                                    ) => (
                                                                                                                        <SelectItem
                                                                                                                            key={
                                                                                                                                s.id
                                                                                                                            }
                                                                                                                            value={s.id.toString()}
                                                                                                                        >
                                                                                                                            {
                                                                                                                                s.name
                                                                                                                            }
                                                                                                                        </SelectItem>
                                                                                                                    )
                                                                                                                )}
                                                                                                            </SelectContent>
                                                                                                        </Select>
                                                                                                    </div>
                                                                                                    <div className="col-span-5">
                                                                                                        <Input
                                                                                                            type="number"
                                                                                                            min="1"
                                                                                                            placeholder="Quantity"
                                                                                                            value={
                                                                                                                service.quantity
                                                                                                            }
                                                                                                            onChange={(
                                                                                                                e
                                                                                                            ) =>
                                                                                                                updateService(
                                                                                                                    index,
                                                                                                                    "quantity",
                                                                                                                    parseInt(
                                                                                                                        e
                                                                                                                            .target
                                                                                                                            .value
                                                                                                                    ) ||
                                                                                                                        1
                                                                                                                )
                                                                                                            }
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>

                                                                                                {service.id &&
                                                                                                    (() => {
                                                                                                        const selectedService =
                                                                                                            services.find(
                                                                                                                (
                                                                                                                    s
                                                                                                                ) =>
                                                                                                                    s.id ===
                                                                                                                    parseInt(
                                                                                                                        service.id
                                                                                                                    )
                                                                                                            );
                                                                                                        if (
                                                                                                            !selectedService
                                                                                                        )
                                                                                                            return null;

                                                                                                        if (
                                                                                                            selectedService.type ===
                                                                                                            "selectable"
                                                                                                        ) {
                                                                                                            return (
                                                                                                                <div className="grid grid-cols-12 gap-2">
                                                                                                                    <div className="col-span-12">
                                                                                                                        <Select
                                                                                                                            value={
                                                                                                                                service
                                                                                                                                    .details
                                                                                                                                    .package ||
                                                                                                                                ""
                                                                                                                            }
                                                                                                                            onValueChange={(
                                                                                                                                value
                                                                                                                            ) =>
                                                                                                                                updateServiceDetail(
                                                                                                                                    index,
                                                                                                                                    "package",
                                                                                                                                    value
                                                                                                                                )
                                                                                                                            }
                                                                                                                        >
                                                                                                                            <SelectTrigger>
                                                                                                                                <SelectValue placeholder="Select option" />
                                                                                                                            </SelectTrigger>
                                                                                                                            <SelectContent>
                                                                                                                                {selectedService.options &&
                                                                                                                                    selectedService.options.map(
                                                                                                                                        (
                                                                                                                                            option,
                                                                                                                                            optIndex
                                                                                                                                        ) => (
                                                                                                                                            <SelectItem
                                                                                                                                                key={
                                                                                                                                                    optIndex
                                                                                                                                                }
                                                                                                                                                value={
                                                                                                                                                    option.name
                                                                                                                                                }
                                                                                                                                            >
                                                                                                                                                {
                                                                                                                                                    option.name
                                                                                                                                                }{" "}
                                                                                                                                                -{" "}
                                                                                                                                                {formatPrice(
                                                                                                                                                    option.price
                                                                                                                                                )}
                                                                                                                                            </SelectItem>
                                                                                                                                        )
                                                                                                                                    )}
                                                                                                                            </SelectContent>
                                                                                                                        </Select>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            );
                                                                                                        }

                                                                                                        if (
                                                                                                            selectedService.type ===
                                                                                                            "per_unit"
                                                                                                        ) {
                                                                                                            return (
                                                                                                                <div className="grid grid-cols-12 gap-2">
                                                                                                                    <div className="col-span-12">
                                                                                                                        <Input
                                                                                                                            type="number"
                                                                                                                            min="0"
                                                                                                                            step="0.01"
                                                                                                                            placeholder="Weight/Unit"
                                                                                                                            value={
                                                                                                                                service
                                                                                                                                    .details
                                                                                                                                    .weight ||
                                                                                                                                ""
                                                                                                                            }
                                                                                                                            onChange={(
                                                                                                                                e
                                                                                                                            ) =>
                                                                                                                                updateServiceDetail(
                                                                                                                                    index,
                                                                                                                                    "weight",
                                                                                                                                    parseFloat(
                                                                                                                                        e
                                                                                                                                            .target
                                                                                                                                            .value
                                                                                                                                    ) ||
                                                                                                                                        0
                                                                                                                                )
                                                                                                                            }
                                                                                                                        />
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            );
                                                                                                        }

                                                                                                        return null;
                                                                                                    })()}
                                                                                            </div>
                                                                                        )
                                                                                    )}

                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        onClick={
                                                                                            addService
                                                                                        }
                                                                                        className="mt-2"
                                                                                    >
                                                                                        <Plus className="h-4 w-4 mr-1" />{" "}
                                                                                        Add
                                                                                        Service
                                                                                    </Button>

                                                                                    {errors.services && (
                                                                                        <p className="text-red-500 text-sm mt-1">
                                                                                            {
                                                                                                errors.services
                                                                                            }
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                                            <Label
                                                                                htmlFor="status"
                                                                                className="text-right"
                                                                            >
                                                                                Status
                                                                                *
                                                                            </Label>
                                                                            <Select
                                                                                value={
                                                                                    data.status
                                                                                }
                                                                                onValueChange={(
                                                                                    value
                                                                                ) =>
                                                                                    setData(
                                                                                        "status",
                                                                                        value
                                                                                    )
                                                                                }
                                                                            >
                                                                                <SelectTrigger className="col-span-3">
                                                                                    <SelectValue placeholder="Select status" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="pending">
                                                                                        Pending
                                                                                    </SelectItem>
                                                                                    <SelectItem value="paid">
                                                                                        Paid
                                                                                    </SelectItem>
                                                                                    <SelectItem value="cancelled">
                                                                                        Cancelled
                                                                                    </SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                            {errors.status && (
                                                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                                                    {
                                                                                        errors.status
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>

                                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                                            <Label
                                                                                htmlFor="payment_method"
                                                                                className="text-right"
                                                                            >
                                                                                Payment
                                                                                Method
                                                                                *
                                                                            </Label>
                                                                            <Select
                                                                                value={
                                                                                    data.payment_method
                                                                                }
                                                                                onValueChange={(
                                                                                    value
                                                                                ) =>
                                                                                    setData(
                                                                                        "payment_method",
                                                                                        value
                                                                                    )
                                                                                }
                                                                            >
                                                                                <SelectTrigger className="col-span-3">
                                                                                    <SelectValue placeholder="Select payment method" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="cash">
                                                                                        Cash
                                                                                    </SelectItem>
                                                                                    <SelectItem value="online">
                                                                                        Online
                                                                                    </SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                            {errors.payment_method && (
                                                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                                                    {
                                                                                        errors.payment_method
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <DialogFooter>
                                                                        <Button
                                                                            type="submit"
                                                                            disabled={
                                                                                processing
                                                                            }
                                                                        >
                                                                            Update
                                                                            Order
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </form>
                                                            </DialogContent>
                                                        </Dialog>
                                                        <Dialog
                                                            open={
                                                                isDeleteModalOpen &&
                                                                currentOrder?.id ===
                                                                    order.id
                                                            }
                                                            onOpenChange={(
                                                                open
                                                            ) => {
                                                                if (!open)
                                                                    setIsDeleteModalOpen(
                                                                        false
                                                                    );
                                                            }}
                                                        >
                                                            <DialogTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        openDeleteModal(
                                                                            order
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>
                                                                        Confirm
                                                                        Deletion
                                                                    </DialogTitle>
                                                                    <DialogDescription>
                                                                        Are you
                                                                        sure you
                                                                        want to
                                                                        delete
                                                                        this
                                                                        order?
                                                                        This
                                                                        action
                                                                        cannot
                                                                        be
                                                                        undone.
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <DialogFooter>
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() =>
                                                                            setIsDeleteModalOpen(
                                                                                false
                                                                            )
                                                                        }
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        variant="destructive"
                                                                        onClick={
                                                                            handleDelete
                                                                        }
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {expandedRows.includes(
                                                order.id
                                            ) && (
                                                <TableRow
                                                    key={`${order.id}-details`}
                                                >
                                                    <TableCell
                                                        colSpan={8}
                                                        className="p-4 bg-muted/20"
                                                    >
                                                        <div className="space-y-4">
                                                            <h4 className="font-medium">
                                                                Order Details:
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <h5 className="text-sm font-medium mb-2">
                                                                        Customer
                                                                        Information
                                                                    </h5>
                                                                    <div className="space-y-1 text-sm">
                                                                        <p>
                                                                            <span className="font-medium">
                                                                                Name:
                                                                            </span>{" "}
                                                                            {
                                                                                order
                                                                                    .customer
                                                                                    .name
                                                                            }
                                                                        </p>
                                                                        <p>
                                                                            <span className="font-medium">
                                                                                Email:
                                                                            </span>{" "}
                                                                            {order
                                                                                .customer
                                                                                .email ||
                                                                                "N/A"}
                                                                        </p>
                                                                        <p>
                                                                            <span className="font-medium">
                                                                                Phone:
                                                                            </span>{" "}
                                                                            {order
                                                                                .customer
                                                                                .phone ||
                                                                                "N/A"}
                                                                        </p>
                                                                        <p>
                                                                            <span className="font-medium">
                                                                                Country:
                                                                            </span>{" "}
                                                                            {order
                                                                                .customer
                                                                                .passport_country ||
                                                                                "N/A"}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-sm font-medium mb-2">
                                                                        Order
                                                                        Information
                                                                    </h5>
                                                                    <div className="space-y-1 text-sm">
                                                                        <p>
                                                                            <span className="font-medium">
                                                                                Status:
                                                                            </span>{" "}
                                                                            {
                                                                                order.status
                                                                            }
                                                                        </p>
                                                                        <p>
                                                                            <span className="font-medium">
                                                                                Payment
                                                                                Method:
                                                                            </span>{" "}
                                                                            {
                                                                                order.payment_method
                                                                            }
                                                                        </p>
                                                                        <p>
                                                                            <span className="font-medium">
                                                                                Order
                                                                                Date:
                                                                            </span>{" "}
                                                                            {formatDate(
                                                                                order.created_at
                                                                            )}
                                                                        </p>
                                                                        <p>
                                                                            <span className="font-medium">
                                                                                Total:
                                                                            </span>{" "}
                                                                            {formatPrice(
                                                                                order.total_price
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <h5 className="text-sm font-medium mb-2">
                                                                    Services
                                                                </h5>
                                                                <div className="border rounded-md">
                                                                    <Table>
                                                                        <TableHeader>
                                                                            <TableRow>
                                                                                <TableHead>
                                                                                    Service
                                                                                </TableHead>
                                                                                <TableHead>
                                                                                    Quantity
                                                                                </TableHead>
                                                                                <TableHead>
                                                                                    Price/Unit
                                                                                </TableHead>
                                                                                <TableHead>
                                                                                    Total
                                                                                </TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {order.services.map(
                                                                                (
                                                                                    service
                                                                                ) => (
                                                                                    <TableRow
                                                                                        key={
                                                                                            service.id
                                                                                        }
                                                                                    >
                                                                                        <TableCell>
                                                                                            {
                                                                                                service.name
                                                                                            }
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                            {
                                                                                                service
                                                                                                    .pivot
                                                                                                    .quantity
                                                                                            }
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                            {formatPrice(
                                                                                                service
                                                                                                    .pivot
                                                                                                    .price_per_unit
                                                                                            )}
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                            {formatPrice(
                                                                                                service
                                                                                                    .pivot
                                                                                                    .price_per_unit *
                                                                                                    service
                                                                                                        .pivot
                                                                                                        .quantity
                                                                                            )}
                                                                                        </TableCell>
                                                                                    </TableRow>
                                                                                )
                                                                            )}
                                                                        </TableBody>
                                                                    </Table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="text-center py-8"
                                        >
                                            No orders found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-muted-foreground">
                            Showing {ordersData.length} orders
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const newPage = ordersData.current_page - 1;
                                    setCurrentPage(newPage);
                                    router.get(
                                        buildPaginationUrl(
                                            ordersData.prev_page_url
                                        ),
                                        {},
                                        { preserveState: true }
                                    );
                                }}
                                disabled={!ordersData.prev_page_url}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const newPage = ordersData.current_page + 1;
                                    setCurrentPage(newPage);
                                    router.get(
                                        buildPaginationUrl(
                                            ordersData.next_page_url
                                        ),
                                        {},
                                        { preserveState: true }
                                    );
                                }}
                                disabled={!ordersData.next_page_url}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

Orders.layout = (page) => <AuthenticatedLayout children={page} />;
