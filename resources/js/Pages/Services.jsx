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
    Info,
} from "lucide-react";
import { toast } from "sonner";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Services() {
    const { services, filters, flash } = usePage().props;
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
    const [currentPage, setCurrentPage] = useState(filters.page || 1);
    const [expandedRows, setExpandedRows] = useState([]);

    // Initialize form for creating/editing services
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
        selectedType,
        selectedFulfillment,
        sortBy,
        sortDirection,
        currentPage,
    ]);

    const applyFilters = () => {
        router.get(
            route("services.index"),
            {
                search: searchTerm,
                type: selectedType === "all" ? "" : selectedType,
                fulfillment_type:
                    selectedFulfillment === "all" ? "" : selectedFulfillment,
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
        setData({
            name: "",
            description: "",
            type: "fixed",
            fulfillment_type: "direct",
            price: "",
            unit_name: "",
            options: [{ name: "", price: "" }],
        });
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
            options: service.options || [{ name: "", price: "" }],
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
        put(route("services.update", currentService.id), {
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
        router.delete(route("services.destroy", currentService.id), {
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
        setSelectedType("all");
        setSelectedFulfillment("all");
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

    const formatType = (type) => {
        if (type === "per_unit") return "Per Unit";
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const formatFulfillment = (type) => {
        return type
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const addOption = () => {
        setData("options", [...data.options, { name: "", price: "" }]);
    };

    const removeOption = (index) => {
        if (data.options.length > 1) {
            const newOptions = [...data.options];
            newOptions.splice(index, 1);
            setData("options", newOptions);
        }
    };

    const updateOption = (index, field, value) => {
        const newOptions = [...data.options];
        newOptions[index][field] = value;
        setData("options", newOptions);
    };

    const toggleRow = (id) => {
        if (expandedRows.includes(id)) {
            setExpandedRows(expandedRows.filter(rowId => rowId !== id));
        } else {
            setExpandedRows([...expandedRows, id]);
        }
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
        urlObj.searchParams.set("type", selectedType === "all" ? "" : selectedType);
        urlObj.searchParams.set(
            "fulfillment_type",
            selectedFulfillment === "all" ? "" : selectedFulfillment
        );
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
                                Services
                            </CardTitle>
                            <CardDescription>
                                Manage your service offerings
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
                                    <Plus className="h-4 w-4" /> Add Service
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>
                                        Create New Service
                                    </DialogTitle>
                                    <DialogDescription>
                                        Add a new service to your offerings
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
                                                htmlFor="description"
                                                className="text-right"
                                            >
                                                Description
                                            </Label>
                                            <Input
                                                id="description"
                                                value={data.description}
                                                onChange={(e) =>
                                                    setData(
                                                        "description",
                                                        e.target.value
                                                    )
                                                }
                                                className="col-span-3"
                                            />
                                            {errors.description && (
                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                    {errors.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="type"
                                                className="text-right"
                                            >
                                                Type *
                                            </Label>
                                            <Select
                                                value={data.type}
                                                onValueChange={(value) =>
                                                    setData("type", value)
                                                }
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="fixed">
                                                        Fixed Price
                                                    </SelectItem>
                                                    <SelectItem value="per_unit">
                                                        Per Unit
                                                    </SelectItem>
                                                    <SelectItem value="selectable">
                                                        Selectable Options
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.type && (
                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                    {errors.type}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="fulfillment_type"
                                                className="text-right"
                                            >
                                                Fulfillment *
                                            </Label>
                                            <Select
                                                value={data.fulfillment_type}
                                                onValueChange={(value) =>
                                                    setData(
                                                        "fulfillment_type",
                                                        value
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select fulfillment" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="direct">
                                                        Direct
                                                    </SelectItem>
                                                    <SelectItem value="staff_assisted">
                                                        Staff Assisted
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.fulfillment_type && (
                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                    {errors.fulfillment_type}
                                                </p>
                                            )}
                                        </div>

                                        {data.type === "fixed" && (
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label
                                                    htmlFor="price"
                                                    className="text-right"
                                                >
                                                    Price *
                                                </Label>
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={data.price}
                                                    onChange={(e) =>
                                                        setData(
                                                            "price",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="col-span-3"
                                                />
                                                {errors.price && (
                                                    <p className="text-red-500 text-sm col-span-4 text-right">
                                                        {errors.price}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {data.type === "per_unit" && (
                                            <>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label
                                                        htmlFor="unit_name"
                                                        className="text-right"
                                                    >
                                                        Unit Name *
                                                    </Label>
                                                    <Input
                                                        id="unit_name"
                                                        value={data.unit_name}
                                                        onChange={(e) =>
                                                            setData(
                                                                "unit_name",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="col-span-3"
                                                    />
                                                    {errors.unit_name && (
                                                        <p className="text-red-500 text-sm col-span-4 text-right">
                                                            {errors.unit_name}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label
                                                        htmlFor="price"
                                                        className="text-right"
                                                    >
                                                        Price per Unit *
                                                    </Label>
                                                    <Input
                                                        id="price"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={data.price}
                                                        onChange={(e) =>
                                                            setData(
                                                                "price",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="col-span-3"
                                                    />
                                                    {errors.price && (
                                                        <p className="text-red-500 text-sm col-span-4 text-right">
                                                            {errors.price}
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {data.type === "selectable" && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label className="text-right">
                                                        Options *
                                                    </Label>
                                                    <div className="col-span-3 space-y-2">
                                                        {data.options.map(
                                                            (option, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="grid grid-cols-12 gap-2"
                                                                >
                                                                    <div className="col-span-5">
                                                                        <Input
                                                                            placeholder="Option name"
                                                                            value={
                                                                                option.name
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                updateOption(
                                                                                    index,
                                                                                    "name",
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-5">
                                                                        <Input
                                                                            type="number"
                                                                            placeholder="Price"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={
                                                                                option.price
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                updateOption(
                                                                                    index,
                                                                                    "price",
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                removeOption(
                                                                                    index
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                data.options
                                                                                    .length <=
                                                                                1
                                                                            }
                                                                            className="w-full"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={addOption}
                                                            className="mt-2"
                                                        >
                                                            <Plus className="h-4 w-4 mr-1" />{" "}
                                                            Add Option
                                                        </Button>
                                                        {errors.options && (
                                                            <p className="text-red-500 text-sm mt-1">
                                                                {errors.options}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Create Service
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
                                placeholder="Search services..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select
                                value={selectedType}
                                onValueChange={setSelectedType}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Types
                                    </SelectItem>
                                    <SelectItem value="fixed">
                                        Fixed Price
                                    </SelectItem>
                                    <SelectItem value="per_unit">
                                        Per Unit
                                    </SelectItem>
                                    <SelectItem value="selectable">
                                        Selectable
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={selectedFulfillment}
                                onValueChange={setSelectedFulfillment}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Fulfillment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Fulfillments
                                    </SelectItem>
                                    <SelectItem value="direct">
                                        Direct
                                    </SelectItem>
                                    <SelectItem value="staff_assisted">
                                        Staff Assisted
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
                                    <SortableHeader field="name">
                                        Name
                                    </SortableHeader>
                                    <SortableHeader field="type">
                                        Type
                                    </SortableHeader>
                                    <SortableHeader field="fulfillment_type">
                                        Fulfillment
                                    </SortableHeader>
                                    <SortableHeader field="price">
                                        Price
                                    </SortableHeader>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.data.length > 0 ? (
                                    services.data.map((service) => (
                                        <>
                                            <TableRow 
                                                key={service.id} 
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => toggleRow(service.id)}
                                            >
                                                <TableCell>
                                                    {service.type === "selectable" && (
                                                        <Button variant="ghost" size="sm">
                                                            {expandedRows.includes(service.id) ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {service.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {formatType(service.type)}
                                                        {service.type ===
                                                            "per_unit" &&
                                                            ` (${service.unit_name})`}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {formatFulfillment(
                                                            service.fulfillment_type
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {service.type === "selectable" ? (
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-sm">Multiple options</span>
                                                            <Info className="h-3 w-3 text-muted-foreground" />
                                                        </div>
                                                    ) : (
                                                        formatPrice(service.price)
                                                    )}
                                                </TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex space-x-2">
                                                        <Dialog
                                                            open={
                                                                isEditModalOpen &&
                                                                currentService?.id ===
                                                                    service.id
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
                                                                            service
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-[600px]">
                                                                <DialogHeader>
                                                                    <DialogTitle>
                                                                        Edit Service
                                                                    </DialogTitle>
                                                                    <DialogDescription>
                                                                        Update
                                                                        service
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
                                                                                htmlFor="edit-description"
                                                                                className="text-right"
                                                                            >
                                                                                Description
                                                                            </Label>
                                                                            <Input
                                                                                id="edit-description"
                                                                                value={
                                                                                    data.description
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) =>
                                                                                    setData(
                                                                                        "description",
                                                                                        e
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                className="col-span-3"
                                                                            />
                                                                            {errors.description && (
                                                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                                                    {
                                                                                        errors.description
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                                            <Label
                                                                                htmlFor="edit-type"
                                                                                className="text-right"
                                                                            >
                                                                                Type
                                                                                *
                                                                            </Label>
                                                                            <Select
                                                                                value={
                                                                                    data.type
                                                                                }
                                                                                onValueChange={(
                                                                                    value
                                                                                ) =>
                                                                                    setData(
                                                                                        "type",
                                                                                        value
                                                                                    )
                                                                                }
                                                                            >
                                                                                <SelectTrigger className="col-span-3">
                                                                                    <SelectValue placeholder="Select type" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="fixed">
                                                                                        Fixed
                                                                                        Price
                                                                                    </SelectItem>
                                                                                    <SelectItem value="per_unit">
                                                                                        Per
                                                                                        Unit
                                                                                    </SelectItem>
                                                                                    <SelectItem value="selectable">
                                                                                        Selectable
                                                                                        Options
                                                                                    </SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                            {errors.type && (
                                                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                                                    {
                                                                                        errors.type
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                                            <Label
                                                                                htmlFor="edit-fulfillment_type"
                                                                                className="text-right"
                                                                            >
                                                                                Fulfillment
                                                                                *
                                                                            </Label>
                                                                            <Select
                                                                                value={
                                                                                    data.fulfillment_type
                                                                                }
                                                                                onValueChange={(
                                                                                    value
                                                                                ) =>
                                                                                    setData(
                                                                                        "fulfillment_type",
                                                                                        value
                                                                                    )
                                                                                }
                                                                            >
                                                                                <SelectTrigger className="col-span-3">
                                                                                    <SelectValue placeholder="Select fulfillment" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="direct">
                                                                                        Direct
                                                                                    </SelectItem>
                                                                                    <SelectItem value="staff_assisted">
                                                                                        Staff
                                                                                        Assisted
                                                                                    </SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                            {errors.fulfillment_type && (
                                                                                <p className="text-red-500 text-sm col-span-4 text-right">
                                                                                    {
                                                                                        errors.fulfillment_type
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>

                                                                        {data.type ===
                                                                            "fixed" && (
                                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                                <Label
                                                                                    htmlFor="edit-price"
                                                                                    className="text-right"
                                                                                >
                                                                                    Price
                                                                                    *
                                                                                </Label>
                                                                                <Input
                                                                                    id="edit-price"
                                                                                    type="number"
                                                                                    min="0"
                                                                                    step="0.01"
                                                                                    value={
                                                                                        data.price
                                                                                    }
                                                                                    onChange={(
                                                                                        e
                                                                                    ) =>
                                                                                        setData(
                                                                                            "price",
                                                                                            e
                                                                                                .target
                                                                                                .value
                                                                                        )
                                                                                    }
                                                                                    className="col-span-3"
                                                                                />
                                                                                {errors.price && (
                                                                                    <p className="text-red-500 text-sm col-span-4 text-right">
                                                                                        {
                                                                                            errors.price
                                                                                        }
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {data.type ===
                                                                            "per_unit" && (
                                                                            <>
                                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                                    <Label
                                                                                        htmlFor="edit-unit_name"
                                                                                        className="text-right"
                                                                                    >
                                                                                        Unit
                                                                                        Name
                                                                                        *
                                                                                    </Label>
                                                                                    <Input
                                                                                        id="edit-unit_name"
                                                                                        value={
                                                                                            data.unit_name
                                                                                        }
                                                                                        onChange={(
                                                                                            e
                                                                                        ) =>
                                                                                            setData(
                                                                                                "unit_name",
                                                                                                e
                                                                                                    .target
                                                                                                    .value
                                                                                            )
                                                                                        }
                                                                                        className="col-span-3"
                                                                                    />
                                                                                    {errors.unit_name && (
                                                                                        <p className="text-red-500 text-sm col-span-4 text-right">
                                                                                            {
                                                                                                errors.unit_name
                                                                                            }
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                                    <Label
                                                                                        htmlFor="edit-price"
                                                                                        className="text-right"
                                                                                    >
                                                                                        Price
                                                                                        per
                                                                                        Unit
                                                                                        *
                                                                                    </Label>
                                                                                    <Input
                                                                                        id="edit-price"
                                                                                        type="number"
                                                                                        min="0"
                                                                                        step="0.01"
                                                                                        value={
                                                                                            data.price
                                                                                        }
                                                                                        onChange={(
                                                                                            e
                                                                                        ) =>
                                                                                            setData(
                                                                                                "price",
                                                                                                e
                                                                                                    .target
                                                                                                    .value
                                                                                            )
                                                                                        }
                                                                                        className="col-span-3"
                                                                                    />
                                                                                    {errors.price && (
                                                                                        <p className="text-red-500 text-sm col-span-4 text-right">
                                                                                            {
                                                                                                errors.price
                                                                                            }
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </>
                                                                        )}

                                                                        {data.type ===
                                                                            "selectable" && (
                                                                            <div className="space-y-4">
                                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                                    <Label className="text-right">
                                                                                        Options
                                                                                        *
                                                                                    </Label>
                                                                                    <div className="col-span-3 space-y-2">
                                                                                        {data.options.map(
                                                                                            (
                                                                                                option,
                                                                                                index
                                                                                            ) => (
                                                                                                <div
                                                                                                    key={
                                                                                                        index
                                                                                                    }
                                                                                                    className="grid grid-cols-12 gap-2"
                                                                                                >
                                                                                                    <div className="col-span-5">
                                                                                                        <Input
                                                                                                            placeholder="Option name"
                                                                                                            value={
                                                                                                                option.name
                                                                                                            }
                                                                                                            onChange={(
                                                                                                                e
                                                                                                            ) =>
                                                                                                                updateOption(
                                                                                                                    index,
                                                                                                                    "name",
                                                                                                                    e
                                                                                                                        .target
                                                                                                                        .value
                                                                                                                )
                                                                                                            }
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div className="col-span-5">
                                                                                                        <Input
                                                                                                            type="number"
                                                                                                            placeholder="Price"
                                                                                                            min="0"
                                                                                                            step="0.01"
                                                                                                            value={
                                                                                                                option.price
                                                                                                            }
                                                                                                            onChange={(
                                                                                                                e
                                                                                                            ) =>
                                                                                                                updateOption(
                                                                                                                    index,
                                                                                                                    "price",
                                                                                                                    e
                                                                                                                        .target
                                                                                                                        .value
                                                                                                                )
                                                                                                            }
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div className="col-span-2">
                                                                                                        <Button
                                                                                                            type="button"
                                                                                                            variant="outline"
                                                                                                            size="sm"
                                                                                                            onClick={() =>
                                                                                                                removeOption(
                                                                                                                    index
                                                                                                                )
                                                                                                            }
                                                                                                            disabled={
                                                                                                                data.options
                                                                                                                    .length <=
                                                                                                                1
                                                                                                            }
                                                                                                            className="w-full"
                                                                                                        >
                                                                                                            <X className="h-4 w-4" />
                                                                                                        </Button>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )
                                                                                        )}
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="outline"
                                                                                            size="sm"
                                                                                            onClick={
                                                                                                addOption
                                                                                            }
                                                                                            className="mt-2"
                                                                                        >
                                                                                            <Plus className="h-4 w-4 mr-1" />{" "}
                                                                                            Add
                                                                                            Option
                                                                                        </Button>
                                                                                        {errors.options && (
                                                                                            <p className="text-red-500 text-sm mt-1">
                                                                                                {
                                                                                                    errors.options
                                                                                                }
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <DialogFooter>
                                                                        <Button
                                                                            type="submit"
                                                                            disabled={
                                                                                processing
                                                                            }
                                                                        >
                                                                            Update
                                                                            Service
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </form>
                                                            </DialogContent>
                                                        </Dialog>
                                                        <Dialog
                                                            open={
                                                                isDeleteModalOpen &&
                                                                currentService?.id ===
                                                                    service.id
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
                                                                            service
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
                                                                            service.name
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
                                            {service.type === "selectable" && expandedRows.includes(service.id) && (
                                                <TableRow key={`${service.id}-options`}>
                                                    <TableCell colSpan={6} className="p-4 bg-muted/20">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium">Available Options:</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                {service.options && service.options.map((option, index) => (
                                                                    <div key={index} className="flex justify-between items-center p-2 bg-background border rounded">
                                                                        <span>{option.name}</span>
                                                                        <span className="font-medium">{formatPrice(option.price)}</span>
                                                                    </div>
                                                                ))}
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
                                            colSpan={6}
                                            className="text-center py-8"
                                        >
                                            No services found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-muted-foreground">
                            Showing {services.from} to {services.to} of{" "}
                            {services.total} services
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const newPage = services.current_page - 1;
                                    setCurrentPage(newPage);
                                    router.get(
                                        buildPaginationUrl(
                                            services.prev_page_url
                                        ),
                                        {},
                                        { preserveState: true }
                                    );
                                }}
                                disabled={!services.prev_page_url}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const newPage = services.current_page + 1;
                                    setCurrentPage(newPage);
                                    router.get(
                                        buildPaginationUrl(
                                            services.next_page_url
                                        ),
                                        {},
                                        { preserveState: true }
                                    );
                                }}
                                disabled={!services.next_page_url}
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

Services.layout = (page) => <AuthenticatedLayout children={page} />;