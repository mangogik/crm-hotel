import { useState, useEffect } from "react";
import { usePage, useForm, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

import CustomerHeader from "@/components/customers/CustomerHeader";
import CustomerFilters from "@/components/customers/CustomerFilters";
import CustomersTable from "@/components/customers/CustomersTable";
import CustomerForm from "@/components/customers/CustomerForm";
import DeleteCustomerModal from "@/components/customers/DeleteCustomerModal";
import Pagination from "@/components/customers/Pagination";

export default function Customers() {
    const { customers, filters, flash } = usePage().props;
    
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [selectedCountry, setSelectedCountry] = useState(filters.passport_country || "all");
    const [checkinDateFilter, setCheckinDateFilter] = useState(filters.checkin_date || "");
    const [checkoutDateFilter, setCheckoutDateFilter] = useState(filters.checkout_date || "");
    const [sortBy, setSortBy] = useState(filters.sort_by || "created_at");
    const [sortDirection, setSortDirection] = useState(filters.sort_direction || "desc");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [countries, setCountries] = useState(["all"]);
    const [expandedRows, setExpandedRows] = useState([]);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: "", email: "", phone: "", passport_country: "",
        checkin_at: "", checkout_at: "", notes: "",
    });

    useEffect(() => {
        const uniqueCountries = [...new Set(customers.data.map(c => c.passport_country).filter(Boolean))];
        setCountries(["all", ...uniqueCountries]);
    }, [customers]);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        const timer = setTimeout(() => applyFilters(1), 500); // Reset to page 1 on filter change
        return () => clearTimeout(timer);
    }, [searchTerm, selectedCountry, checkinDateFilter, checkoutDateFilter, sortBy, sortDirection]);

    const applyFilters = (page = filters.page || 1) => {
        router.get(route("customers.index"), {
            search: searchTerm,
            passport_country: selectedCountry === "all" ? "" : selectedCountry,
            checkin_date: checkinDateFilter,
            checkout_date: checkoutDateFilter,
            sort_by: sortBy,
            sort_direction: sortDirection,
            page,
        }, { preserveState: true, replace: true });
    };

    const handleSort = (field) => {
        setSortBy(field);
        setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    };

    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsCreateModalOpen(true);
    };

    const openEditModal = (customer) => {
        setData({ ...customer });
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
            onSuccess: () => setIsCreateModalOpen(false),
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        put(route("customers.update", currentCustomer.id), {
            onSuccess: () => setIsEditModalOpen(false),
        });
    };

    const handleDelete = () => {
        router.delete(route("customers.destroy", currentCustomer.id), {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedCountry("all");
        setCheckinDateFilter("");
        setCheckoutDateFilter("");
        setSortBy("created_at");
        setSortDirection("desc");
    };

    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : "N/A";
    const toggleRow = (id) => setExpandedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);

    const buildPaginationUrl = (url) => {
        if (!url) return null;
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        params.set("search", searchTerm);
        params.set("passport_country", selectedCountry === "all" ? "" : selectedCountry);
        params.set("checkin_date", checkinDateFilter);
        params.set("checkout_date", checkoutDateFilter);
        params.set("sort_by", sortBy);
        params.set("sort_direction", sortDirection);
        return `${urlObj.pathname}?${params.toString()}`;
    };

    return (
        <div className="container mx-auto py-2 px-4">
            <Card className="mb-8">
                <CustomerHeader onAddCustomer={openCreateModal} />
                <CardContent>
                    <CustomerFilters
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry}
                        checkinDateFilter={checkinDateFilter} setCheckinDateFilter={setCheckinDateFilter}
                        checkoutDateFilter={checkoutDateFilter} setCheckoutDateFilter={setCheckoutDateFilter}
                        clearFilters={clearFilters} countries={countries}
                    />
                    <CustomersTable
                        customers={customers.data}
                        expandedRows={expandedRows} toggleRow={toggleRow}
                        openEditModal={openEditModal} openDeleteModal={openDeleteModal}
                        formatDate={formatDate} sortBy={sortBy}
                        sortDirection={sortDirection} handleSort={handleSort}
                    />
                    <Pagination paginationData={customers} buildPaginationUrl={buildPaginationUrl} />
                </CardContent>
            </Card>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create New Customer</DialogTitle>
                        <DialogDescription>Add a new customer to your database</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <CustomerForm data={data} setData={setData} errors={errors} />
                        <DialogFooter><Button type="submit" disabled={processing}>Create Customer</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Customer</DialogTitle>
                        <DialogDescription>Update customer information</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate}>
                        <CustomerForm data={data} setData={setData} errors={errors} />
                        <DialogFooter><Button type="submit" disabled={processing}>Update Customer</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteCustomerModal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} onConfirm={handleDelete} customer={currentCustomer} />
        </div>
    );
}

Customers.layout = (page) => <AuthenticatedLayout children={page} />;
