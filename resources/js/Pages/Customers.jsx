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

  // ================== Filters / sorting state ==================
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [selectedCountry, setSelectedCountry] = useState(
    filters.passport_country || "all"
  );
  const [selectedMembership, setSelectedMembership] = useState(
    filters.membership_type || "all"
  );
  const [lastVisitFrom, setLastVisitFrom] = useState(
    filters.last_visit_from || ""
  );
  const [lastVisitTo, setLastVisitTo] = useState(filters.last_visit_to || "");
  const [sortBy, setSortBy] = useState(filters.sort_by || "created_at");
  const [sortDirection, setSortDirection] = useState(
    filters.sort_direction || "desc"
  );

  // ================== UI state ==================
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [countries, setCountries] = useState(["all"]);
  const [expandedRows, setExpandedRows] = useState([]);

  // ================== Create form (A) ==================
  const createInitial = {
    name: "",
    email: "",
    phone: "",
    passport_country: "",
    birth_date: "",
    notes: "",
  };
  const {
    data: createData,
    setData: setCreateData,
    post: postCreate,
    processing: createProcessing,
    errors: createErrors,
    reset: createReset,
    clearErrors: createClearErrors,
    setDefaults: setCreateDefaults,
  } = useForm(createInitial);

  // ================== Edit form (A) ==================
  const editInitial = {
    name: "",
    email: "",
    phone: "",
    passport_country: "",
    birth_date: "",
    notes: "",
  };
  const {
    data: editData,
    setData: setEditData,
    put: putEdit,
    processing: editProcessing,
    errors: editErrors,
    reset: editReset,
    clearErrors: editClearErrors,
    setDefaults: setEditDefaults,
  } = useForm(editInitial);

  // ================== Effects ==================
  useEffect(() => {
    const uniqueCountries = [
      ...new Set(
        customers.data.map((c) => c.passport_country).filter(Boolean)
      ),
    ];
    setCountries(["all", ...uniqueCountries]);
  }, [customers]);

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  useEffect(() => {
    const timer = setTimeout(() => applyFilters(1), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchTerm,
    selectedCountry,
    selectedMembership,
    lastVisitFrom,
    lastVisitTo,
    sortBy,
    sortDirection,
  ]);

  // ================== Actions ==================
  const applyFilters = (page = filters.page || 1) => {
    router.get(
      route("customers.index"),
      {
        search: searchTerm,
        passport_country: selectedCountry === "all" ? "" : selectedCountry,
        membership_type:
          selectedMembership === "all" ? "" : selectedMembership,
        last_visit_from: lastVisitFrom,
        last_visit_to: lastVisitTo,
        sort_by: sortBy,
        sort_direction: sortDirection,
        page,
      },
      { preserveState: true, replace: true }
    );
  };

  const handleSort = (field) => {
    setSortBy(field);
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const openCreateModal = () => {
    // bersihkan state khusus Create
    setCreateDefaults(createInitial);
    createReset();
    createClearErrors();

    // pastikan modal edit tertutup supaya state tidak bentrok
    setIsEditModalOpen(false);
    setCurrentCustomer(null);

    setIsCreateModalOpen(true);
  };

  const openEditModal = (customer) => {
    // isi form Edit dari record
    setEditDataFromCustomer(customer);
    editClearErrors();
    setCurrentCustomer(customer);
    setIsEditModalOpen(true);
  };

  const setEditDataFromCustomer = (customer) => {
    setEditDefaults(editInitial); // amankan default
    editReset(); // bersihkan sisa form edit sebelumnya
    setEditData((d) => ({
      ...d,
      name: customer.name ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      passport_country: customer.passport_country ?? "",
      birth_date: customer.birth_date ?? "",
      notes: customer.notes ?? "",
    }));
  };

  const openDeleteModal = (customer) => {
    setCurrentCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    postCreate(route("customers.store"), {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        createReset();
      },
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!currentCustomer) return;
    putEdit(route("customers.update", currentCustomer.id), {
      onSuccess: () => {
        setIsEditModalOpen(false);
        editReset();
      },
    });
  };

  const handleDelete = () => {
    if (!currentCustomer) return;
    router.delete(route("customers.destroy", currentCustomer.id), {
      onSuccess: () => setIsDeleteModalOpen(false),
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCountry("all");
    setSelectedMembership("all");
    setLastVisitFrom("");
    setLastVisitTo("");
    setSortBy("created_at");
    setSortDirection("desc");
  };

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString() : "N/A";

  const toggleRow = (id) =>
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );

  const buildPaginationUrl = (url) => {
    if (!url) return null;
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    params.set("search", searchTerm);
    params.set(
      "passport_country",
      selectedCountry === "all" ? "" : selectedCountry
    );
    params.set(
      "membership_type",
      selectedMembership === "all" ? "" : selectedMembership
    );
    params.set("last_visit_from", lastVisitFrom);
    params.set("last_visit_to", lastVisitTo);
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
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            selectedMembership={selectedMembership}
            setSelectedMembership={setSelectedMembership}
            lastVisitFrom={lastVisitFrom}
            setLastVisitFrom={setLastVisitFrom}
            lastVisitTo={lastVisitTo}
            setLastVisitTo={setLastVisitTo}
            clearFilters={clearFilters}
            countries={countries}
          />
          <CustomersTable
            customers={customers.data}
            expandedRows={expandedRows}
            toggleRow={toggleRow}
            openEditModal={openEditModal}
            openDeleteModal={openDeleteModal}
            formatDate={formatDate}
            sortBy={sortBy}
            sortDirection={sortDirection}
            handleSort={handleSort}
          />
          <Pagination
            paginationData={customers}
            buildPaginationUrl={buildPaginationUrl}
          />
        </CardContent>
      </Card>

      {/* ===== CREATE MODAL (pakai form Create) ===== */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
            <DialogDescription>
              Add a new customer to your database
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <CustomerForm
              data={createData}
              setData={setCreateData}
              errors={createErrors}
            />
            <DialogFooter>
              <Button type="submit" disabled={createProcessing}>
                Create Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT MODAL (pakai form Edit) ===== */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <CustomerForm
              data={editData}
              setData={setEditData}
              errors={editErrors}
            />
            <DialogFooter>
              <Button type="submit" disabled={editProcessing}>
                Update Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteCustomerModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDelete}
        customer={currentCustomer}
      />
    </div>
  );
}

Customers.layout = (page) => <AuthenticatedLayout children={page} />;
