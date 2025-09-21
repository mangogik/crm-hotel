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
    Calendar,
} from "lucide-react";
import { toast } from "sonner";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Customers() {
    const { customers, filters, flash } = usePage().props;
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [selectedCountry, setSelectedCountry] = useState(
        filters.passport_country || "all"
    );
    const [checkinDateFilter, setCheckinDateFilter] = useState(
        filters.checkin_date || ""
    );
    const [checkoutDateFilter, setCheckoutDateFilter] = useState(
        filters.checkout_date || ""
    );
    const [sortBy, setSortBy] = useState(filters.sort_by || "created_at");
    const [sortDirection, setSortDirection] = useState(
        filters.sort_direction || "desc"
    );
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [countries, setCountries] = useState(["all"]);
    const [currentPage, setCurrentPage] = useState(filters.page || 1);

    // Initialize form for creating/editing customers
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: "",
            email: "",
            phone: "",
            passport_country: "",
            checkin_at: "",
            checkout_at: "",
            notes: "",
        });

    // Extract unique countries for filter
    useEffect(() => {
        const uniqueCountries = [
            ...new Set(
                customers.data.map((c) => c.passport_country).filter(Boolean)
            ),
        ];
        setCountries(["all", ...uniqueCountries]); // Add 'all' as the first option
    }, [customers]);

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
        selectedCountry,
        checkinDateFilter,
        checkoutDateFilter,
        sortBy,
        sortDirection,
        currentPage,
    ]);

    const applyFilters = () => {
        router.get(
            route("customers.index"),
            {
                search: searchTerm,
                passport_country:
                    selectedCountry === "all" ? "" : selectedCountry,
                checkin_date: checkinDateFilter,
                checkout_date: checkoutDateFilter,
                sort_by: sortBy,
                sort_direction: sortDirection,
                per_page: filters.per_page,
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
        setIsCreateModalOpen(true);
    };

    const openEditModal = (customer) => {
        setData({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            passport_country: customer.passport_country,
            checkin_at: customer.checkin_at,
            checkout_at: customer.checkout_at,
            notes: customer.notes,
        });
        clearErrors();
        setCurrentCustomer(customer);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (customer) => {
        setCurrentCustomer(customer);
        setIsDeleteModalOpen(true);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        post(route("customers.store"), {
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
        put(route("customers.update", currentCustomer.id), {
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
        router.delete(route("customers.destroy", currentCustomer.id), {
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
        setSelectedCountry("all");
        setCheckinDateFilter("");
        setCheckoutDateFilter("");
        setSortBy("created_at");
        setSortDirection("desc");
        setCurrentPage(1);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString();
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
            "passport_country",
            selectedCountry === "all" ? "" : selectedCountry
        );
        urlObj.searchParams.set("checkin_date", checkinDateFilter);
        urlObj.searchParams.set("checkout_date", checkoutDateFilter);
        urlObj.searchParams.set("sort_by", sortBy);
        urlObj.searchParams.set("sort_direction", sortDirection);
        urlObj.searchParams.set("per_page", filters.per_page);

        return urlObj.pathname + "?" + urlObj.searchParams.toString();
    };

    return (
        <div className="container mx-auto py-2 px-4">
            <Card className="mb-8">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl font-bold">
                                Customers
                            </CardTitle>
                            <CardDescription>
                                Manage your customer database
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
                                    <Plus className="h-4 w-4" /> Add Customer
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>
                                        Create New Customer
                                    </DialogTitle>
                                    <DialogDescription>
                                        Add a new customer to your database
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreate}>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="name"
                                                className="text-right"
                                            >
                                                Name *
                                            </Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) =>
                                                    setData(
                                                        "name",
                                                        e.target.value
                                                    )
                                                }
                                                className="col-span-3"
                                            />
                                            {errors.name && (
                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="email"
                                                className="text-right"
                                            >
                                                Email
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) =>
                                                    setData(
                                                        "email",
                                                        e.target.value
                                                    )
                                                }
                                                className="col-span-3"
                                            />
                                            {errors.email && (
                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="phone"
                                                className="text-right"
                                            >
                                                Phone
                                            </Label>
                                            <Input
                                                id="phone"
                                                value={data.phone}
                                                onChange={(e) =>
                                                    setData(
                                                        "phone",
                                                        e.target.value
                                                    )
                                                }
                                                className="col-span-3"
                                            />
                                            {errors.phone && (
                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                    {errors.phone}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="passport_country"
                                                className="text-right"
                                            >
                                                Country
                                            </Label>
                                            <Input
                                                id="passport_country"
                                                value={data.passport_country}
                                                onChange={(e) =>
                                                    setData(
                                                        "passport_country",
                                                        e.target.value
                                                    )
                                                }
                                                className="col-span-3"
                                            />
                                            {errors.passport_country && (
                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                    {errors.passport_country}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="checkin_at"
                                                className="text-right"
                                            >
                                                Check-in
                                            </Label>
                                            <Input
                                                id="checkin_at"
                                                type="date"
                                                value={data.checkin_at}
                                                onChange={(e) =>
                                                    setData(
                                                        "checkin_at",
                                                        e.target.value
                                                    )
                                                }
                                                className="col-span-3"
                                            />
                                            {errors.checkin_at && (
                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                    {errors.checkin_at}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="checkout_at"
                                                className="text-right"
                                            >
                                                Check-out
                                            </Label>
                                            <Input
                                                id="checkout_at"
                                                type="date"
                                                value={data.checkout_at}
                                                onChange={(e) =>
                                                    setData(
                                                        "checkout_at",
                                                        e.target.value
                                                    )
                                                }
                                                className="col-span-3"
                                            />
                                            {errors.checkout_at && (
                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                    {errors.checkout_at}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="notes"
                                                className="text-right"
                                            >
                                                Notes
                                            </Label>
                                            <Input
                                                id="notes"
                                                value={data.notes}
                                                onChange={(e) =>
                                                    setData(
                                                        "notes",
                                                        e.target.value
                                                    )
                                                }
                                                className="col-span-3"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Create Customer
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
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select
                                value={selectedCountry}
                                onValueChange={setSelectedCountry}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries.map((country) => (
                                        <SelectItem
                                            key={country}
                                            value={country}
                                        >
                                            {country === "all"
                                                ? "All Countries"
                                                : country}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    type="date"
                                    placeholder="Check-in"
                                    value={checkinDateFilter}
                                    onChange={(e) =>
                                        setCheckinDateFilter(e.target.value)
                                    }
                                    className="pl-10"
                                />
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    type="date"
                                    placeholder="Check-out"
                                    value={checkoutDateFilter}
                                    onChange={(e) =>
                                        setCheckoutDateFilter(e.target.value)
                                    }
                                    className="pl-10"
                                />
                            </div>
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
                                    <SortableHeader field="name">
                                        Name
                                    </SortableHeader>
                                    <SortableHeader field="email">
                                        Email
                                    </SortableHeader>
                                    <SortableHeader field="phone">
                                        Phone
                                    </SortableHeader>
                                    <SortableHeader field="passport_country">
                                        Country
                                    </SortableHeader>
                                    <SortableHeader field="checkin_at">
                                        Check-in
                                    </SortableHeader>
                                    <SortableHeader field="checkout_at">
                                        Check-out
                                    </SortableHeader>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.data.length > 0 ? (
                                    customers.data.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell className="font-medium">
                                                {customer.name}
                                            </TableCell>
                                            <TableCell>
                                                {customer.email || "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                {customer.phone || "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                {customer.passport_country && (
                                                    <Badge variant="outline">
                                                        {
                                                            customer.passport_country
                                                        }
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(
                                                    customer.checkin_at
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(
                                                    customer.checkout_at
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Dialog
                                                        open={
                                                            isEditModalOpen &&
                                                            currentCustomer?.id ===
                                                                customer.id
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
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        customer
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[425px]">
                                                            <DialogHeader>
                                                                <DialogTitle>
                                                                    Edit
                                                                    Customer
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    Update
                                                                    customer
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
                                                                            htmlFor="edit-name"
                                                                            className="text-right"
                                                                        >
                                                                            Name
                                                                            *
                                                                        </Label>
                                                                        <Input
                                                                            id="edit-name"
                                                                            value={
                                                                                data.name
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                setData(
                                                                                    "name",
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            className="col-span-3"
                                                                        />
                                                                        {errors.name && (
                                                                            <p className="text-red-500 text-sm col-span-4 text-right">
                                                                                {
                                                                                    errors.name
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                                        <Label
                                                                            htmlFor="edit-email"
                                                                            className="text-right"
                                                                        >
                                                                            Email
                                                                        </Label>
                                                                        <Input
                                                                            id="edit-email"
                                                                            type="email"
                                                                            value={
                                                                                data.email
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                setData(
                                                                                    "email",
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            className="col-span-3"
                                                                        />
                                                                        {errors.email && (
                                                                            <p className="text-red-500 text-sm col-span-4 text-right">
                                                                                {
                                                                                    errors.email
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                                        <Label
                                                                            htmlFor="edit-phone"
                                                                            className="text-right"
                                                                        >
                                                                            Phone
                                                                        </Label>
                                                                        <Input
                                                                            id="edit-phone"
                                                                            value={
                                                                                data.phone
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                setData(
                                                                                    "phone",
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            className="col-span-3"
                                                                        />
                                                                        {errors.phone && (
                                                                            <p className="text-red-500 text-sm col-span-4 text-right">
                                                                                {
                                                                                    errors.phone
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                                        <Label
                                                                            htmlFor="edit-passport_country"
                                                                            className="text-right"
                                                                        >
                                                                            Country
                                                                        </Label>
                                                                        <Input
                                                                            id="edit-passport_country"
                                                                            value={
                                                                                data.passport_country
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                setData(
                                                                                    "passport_country",
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            className="col-span-3"
                                                                        />
                                                                        {errors.passport_country && (
                                                                            <p className="text-red-500 text-sm col-span-4 text-right">
                                                                                {
                                                                                    errors.passport_country
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                                        <Label
                                                                            htmlFor="edit-checkin_at"
                                                                            className="text-right"
                                                                        >
                                                                            Check-in
                                                                        </Label>
                                                                        <Input
                                                                            id="edit-checkin_at"
                                                                            type="date"
                                                                            value={
                                                                                data.checkin_at
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                setData(
                                                                                    "checkin_at",
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            className="col-span-3"
                                                                        />
                                                                        {errors.checkin_at && (
                                                                            <p className="text-red-500 text-sm col-span-4 text-right">
                                                                                {
                                                                                    errors.checkin_at
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                                        <Label
                                                                            htmlFor="edit-checkout_at"
                                                                            className="text-right"
                                                                        >
                                                                            Check-out
                                                                        </Label>
                                                                        <Input
                                                                            id="edit-checkout_at"
                                                                            type="date"
                                                                            value={
                                                                                data.checkout_at
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                setData(
                                                                                    "checkout_at",
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            className="col-span-3"
                                                                        />
                                                                        {errors.checkout_at && (
                                                                            <p className="text-red-500 text-sm col-span-4 text-right">
                                                                                {
                                                                                    errors.checkout_at
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                                        <Label
                                                                            htmlFor="edit-notes"
                                                                            className="text-right"
                                                                        >
                                                                            Notes
                                                                        </Label>
                                                                        <Input
                                                                            id="edit-notes"
                                                                            value={
                                                                                data.notes
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                setData(
                                                                                    "notes",
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            className="col-span-3"
                                                                        />
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
                                                                        Customer
                                                                    </Button>
                                                                </DialogFooter>
                                                            </form>
                                                        </DialogContent>
                                                    </Dialog>
                                                    <Dialog
                                                        open={
                                                            isDeleteModalOpen &&
                                                            currentCustomer?.id ===
                                                                customer.id
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
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    openDeleteModal(
                                                                        customer
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
                                                                    Are you sure
                                                                    you want to
                                                                    delete{" "}
                                                                    {
                                                                        customer.name
                                                                    }
                                                                    ? This
                                                                    action
                                                                    cannot be
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
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center py-8"
                                        >
                                            No customers found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-muted-foreground">
                            Showing {customers.from} to {customers.to} of{" "}
                            {customers.total} customers
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const newPage = customers.current_page - 1;
                                    setCurrentPage(newPage);
                                    router.get(
                                        buildPaginationUrl(
                                            customers.prev_page_url
                                        ),
                                        {},
                                        { preserveState: true }
                                    );
                                }}
                                disabled={!customers.prev_page_url}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const newPage = customers.current_page + 1;
                                    setCurrentPage(newPage);
                                    router.get(
                                        buildPaginationUrl(
                                            customers.next_page_url
                                        ),
                                        {},
                                        { preserveState: true }
                                    );
                                }}
                                disabled={!customers.next_page_url}
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
Customers.layout = (page) => <AuthenticatedLayout children={page} />;
