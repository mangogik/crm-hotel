// resources/js/Pages/Bookings.jsx
import { useState, useEffect, useRef } from "react";
import { usePage, router, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { fmtDate, fmtDateTime } from "@/lib/date";
import { APP_TIMEZONE } from "@/lib/date";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

import BookingHeader from "@/components/bookings/BookingHeader";
import BookingFilters from "@/components/bookings/BookingFilters";
import BookingsTable from "@/components/bookings/BookingsTable";
import BookingForm from "@/components/bookings/BookingForm"; // used for CREATE
import DeleteBookingModal from "@/components/bookings/DeleteBookingModal";
import Pagination from "@/components/bookings/Pagination";

/* ------------------------------------------------------------------
   Helper ringkas + LOGGING untuk cek "future" berdasarkan zona waktu
-------------------------------------------------------------------*/
const isFutureInTz = (iso, tz = "Asia/Jakarta") => {
    if (!iso) {
        console.warn("[isFutureInTz] iso is empty/null");
        return false;
    }
    const target = new Date(iso);
    const now = new Date();

    const toTzTuple = (date) => {
        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: tz,
            hour12: false,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).formatToParts(date);
        const get = (t) => +parts.find((p) => p.type === t).value;
        return [
            get("year"),
            get("month"),
            get("day"),
            get("hour"),
            get("minute"),
            get("second"),
        ];
    };

    const a = toTzTuple(target);
    const b = toTzTuple(now);

    let cmp = 0;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            cmp = a[i] > b[i] ? 1 : -1;
            break;
        }
    }

    const fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        dateStyle: "full",
        timeStyle: "medium",
        hour12: false,
    });
    console.group("[isFutureInTz] debug");
    console.log("TZ:", tz);
    console.log("iso:", iso);
    console.log(
        "target (toString):",
        target.toString(),
        "| epoch:",
        target.getTime()
    );
    console.log(
        "now    (toString):",
        now.toString(),
        "| epoch:",
        now.getTime()
    );
    console.log("target in TZ:", fmt.format(target), "| tuple:", a);
    console.log("now    in TZ:", fmt.format(now), "| tuple:", b);
    console.log(
        "compare result:",
        cmp === 0 ? "EQUAL" : cmp > 0 ? "FUTURE" : "PAST"
    );
    console.groupEnd();

    return cmp > 0;
};

const isSameDayInTz = (iso, tz = "Asia/Jakarta") => {
    if (!iso) return false;
    const target = new Date(iso);
    const now = new Date();

    const toYmd = (date) => {
        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: tz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).formatToParts(date);
        const get = (t) => +parts.find((p) => p.type === t).value;
        return [get("year"), get("month"), get("day")]; // [YYYY, MM, DD]
    };

    const a = toYmd(target);
    const b = toYmd(now);

    const same = a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

    console.log("[isSameDayInTz]", { tz, iso, targetYMD: a, nowYMD: b, same });
    return same;
};

export default function Bookings() {
    const { bookings, filters, flash, customers, rooms } = usePage().props;

    // ===== Filters & table =====
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [selectedCustomer, setSelectedCustomer] = useState(
        filters.customer_id || "all"
    );
    const [selectedRoom, setSelectedRoom] = useState(filters.room_id || "all");
    const [selectedStatus, setSelectedStatus] = useState(
        filters.status || "all"
    );
    const [checkinDateFrom, setCheckinDateFrom] = useState(
        filters.checkin_date_from || ""
    );
    const [checkinDateTo, setCheckinDateTo] = useState(
        filters.checkin_date_to || ""
    );
    const [checkoutDateFrom, setCheckoutDateFrom] = useState(
        filters.checkout_date_from || ""
    );
    const [checkoutDateTo, setCheckoutDateTo] = useState(
        filters.checkout_date_to || ""
    );
    const [sortBy, setSortBy] = useState(filters.sort_by || "created_at");
    const [sortDirection, setSortDirection] = useState(
        filters.sort_direction || "desc"
    );
    const [expandedRows, setExpandedRows] = useState([]);

    // ===== Modals =====
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentBooking, setCurrentBooking] = useState(null);

    // ===== Create form =====
    const {
        data: createData,
        setData: setCreateData,
        post: postCreate,
        processing: createProcessing,
        errors: createErrors,
        reset: resetCreate,
        clearErrors: clearCreateErrors,
    } = useForm({
        customer_id: "",
        room_id: "",
        checkin_at: "",
        checkout_at: "",
        status: "reserved", // BE tetap yang menentukan rule akhir
        notes: "",
        source: "direct", // ⬅️ TAMBAHAN: default sumber booking
    });

    // ===== Edit form (UI hanya status; payload lengkap untuk validasi BE) =====
    const {
        data: editData,
        setData: setEditData,
        put: putEdit,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit,
        clearErrors: clearEditErrors,
    } = useForm({
        customer_id: "",
        room_id: "",
        checkin_at: "",
        checkout_at: "",
        notes: "",
        status: "",
        override_future_checkin: false,
        source: "", // ⬅️ TAMBAHAN: ikut dikirim saat update
    });

    // Future-checkin confirmation
    const [confirmOpen, setConfirmOpen] = useState(false);
    const prevStatusRef = useRef("reserved");
    const pendingStatusRef = useRef(null);

    // HITUNG FLAG + LOG
    const strictlyFutureDateTime = isFutureInTz(
        editData?.checkin_at,
        APP_TIMEZONE
    );
    const sameDayAsToday = isSameDayInTz(editData?.checkin_at, APP_TIMEZONE);

    // Future only when it’s not the same calendar day.
    const isFutureCheckin = strictlyFutureDateTime && !sameDayAsToday;
    // const isFutureCheckin = strictlyFutureDateTime;

    console.log("[Bookings.jsx] future-check flags", {
        checkin_at: editData?.checkin_at,
        APP_TIMEZONE,
        strictlyFutureDateTime,
        sameDayAsToday,
        final_isFutureCheckin: isFutureCheckin,
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        const t = setTimeout(() => applyFilters(1), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        searchTerm,
        selectedCustomer,
        selectedRoom,
        selectedStatus,
        checkinDateFrom,
        checkinDateTo,
        checkoutDateFrom,
        checkoutDateTo,
        sortBy,
        sortDirection,
    ]);

    const applyFilters = (page = filters.page || 1) => {
        router.get(
            route("bookings.index"),
            {
                search: searchTerm,
                customer_id: selectedCustomer === "all" ? "" : selectedCustomer,
                room_id: selectedRoom === "all" ? "" : selectedRoom,
                status: selectedStatus === "all" ? "" : selectedStatus,
                checkin_date_from: checkinDateFrom,
                checkin_date_to: checkinDateTo,
                checkout_date_from: checkoutDateFrom,
                checkout_date_to: checkoutDateTo,
                sort_by: sortBy,
                sort_direction: sortDirection,
                page,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setSortDirection("asc");
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedCustomer("all");
        setSelectedRoom("all");
        setSelectedStatus("all");
        setCheckinDateFrom("");
        setCheckinDateTo("");
        setCheckoutDateFrom("");
        setCheckoutDateTo("");
        setSortBy("created_at");
        setSortDirection("desc");
    };

    const toggleRow = (id) =>
        setExpandedRows((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    const buildPaginationUrl = (url) => {
        if (!url) return null;
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        params.set("search", searchTerm);
        params.set(
            "customer_id",
            selectedCustomer === "all" ? "" : selectedCustomer
        );
        params.set("room_id", selectedRoom === "all" ? "" : selectedRoom);
        params.set("status", selectedStatus === "all" ? "" : selectedStatus);
        params.set("checkin_date_from", checkinDateFrom);
        params.set("checkin_date_to", checkinDateTo);
        params.set("checkout_date_from", checkoutDateFrom);
        params.set("checkout_date_to", checkoutDateTo);
        params.set("sort_by", sortBy);
        params.set("sort_direction", sortDirection);
        return `${urlObj.pathname}?${params.toString()}`;
    };

    // ===== Open/close modals =====
    const openCreateModal = () => {
        resetCreate();
        clearCreateErrors();
        setCreateData("status", "reserved");
        setCreateData("source", "direct"); // pastikan default
        setIsCreateModalOpen(true);
    };

    const openEditModal = (booking) => {
        console.group("[openEditModal]");
        console.log("booking:", booking);
        console.log("now (client):", new Date().toString());
        console.groupEnd();

        setCurrentBooking(booking);
        resetEdit();
        clearEditErrors();

        setEditData("customer_id", booking.customer_id?.toString() || "");
        setEditData("room_id", booking.room_id?.toString() || "");
        setEditData("checkin_at", booking.checkin_at || "");
        setEditData("checkout_at", booking.checkout_at || "");
        setEditData("notes", booking.notes || "");
        setEditData("status", booking.status || "reserved");
        setEditData("override_future_checkin", false);
        setEditData("source", booking.source || "direct"); // ikutkan source di payload

        prevStatusRef.current = booking.status || "reserved";
        pendingStatusRef.current = null;

        setIsEditModalOpen(true);
    };

    const openDeleteModal = (booking) => {
        setCurrentBooking(booking);
        setIsDeleteModalOpen(true);
    };

    // ===== Create handler =====
    const handleCreate = (e) => {
        e.preventDefault();
        postCreate(route("bookings.store"), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreate();
                toast.success("Booking created successfully.");
            },
        });
    };

    // ===== Edit: status change with future check-in confirmation =====
    const handleChangeStatus = (nextStatus) => {
        console.log("[handleChangeStatus]", {
            from: editData.status,
            to: nextStatus,
            isFutureCheckin,
            checkin_at: editData.checkin_at,
            tz: APP_TIMEZONE,
        });

        if (nextStatus === "checked_in" && isFutureCheckin) {
            pendingStatusRef.current = nextStatus;
            setConfirmOpen(true);
            return;
        }
        pendingStatusRef.current = null;
        setEditData("status", nextStatus);
        setEditData("override_future_checkin", false);
    };

    const confirmFutureCheckin = () => {
        console.log(
            "[confirmFutureCheckin] proceed with checked_in despite future checkin time"
        );
        if (!pendingStatusRef.current) return;
        setEditData("status", pendingStatusRef.current);
        setEditData("override_future_checkin", true);
        prevStatusRef.current = pendingStatusRef.current;
        pendingStatusRef.current = null;
        setConfirmOpen(false);
    };

    const cancelFutureCheckin = () => {
        console.log(
            "[cancelFutureCheckin] back to previous:",
            prevStatusRef.current
        );
        setEditData("status", prevStatusRef.current || "reserved");
        setEditData("override_future_checkin", false);
        pendingStatusRef.current = null;
        setConfirmOpen(false);
    };

    // ===== Update / Delete =====
    const handleUpdate = (e) => {
        e.preventDefault();
        if (!currentBooking) return;

        console.group("[handleUpdate] payload");
        console.log(editData);
        console.groupEnd();

        putEdit(route("bookings.update", currentBooking.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                toast.success("Booking updated successfully.");
            },
        });
    };

    const handleDelete = () => {
        if (!currentBooking) return;
        router.delete(route("bookings.destroy", currentBooking.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.success("Booking deleted successfully.");
            },
        });
    };

    // ===== Helpers =====
    const formatDate = fmtDate;
    const formatDateTime = fmtDateTime;

    return (
        <div className="container mx-auto py-2 px-4">
            <Card className="mb-8">
                <BookingHeader onAddBooking={openCreateModal} />
                <CardContent>
                    <BookingFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedCustomer={selectedCustomer}
                        setSelectedCustomer={setSelectedCustomer}
                        selectedRoom={selectedRoom}
                        setSelectedRoom={setSelectedRoom}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                        checkinDateFrom={checkinDateFrom}
                        setCheckinDateFrom={setCheckinDateFrom}
                        checkinDateTo={checkinDateTo}
                        setCheckinDateTo={setCheckinDateTo}
                        checkoutDateFrom={checkoutDateFrom}
                        setCheckoutDateFrom={setCheckoutDateFrom}
                        checkoutDateTo={checkoutDateTo}
                        setCheckoutDateTo={setCheckoutDateTo}
                        clearFilters={clearFilters}
                        customers={customers}
                        rooms={rooms}
                    />

                    <BookingsTable
                        bookings={bookings.data}
                        expandedRows={expandedRows}
                        toggleRow={toggleRow}
                        openEditModal={openEditModal}
                        openDeleteModal={openDeleteModal}
                        formatDate={formatDate}
                        formatDateTime={formatDateTime}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        handleSort={handleSort}
                    />

                    <Pagination
                        paginationData={bookings}
                        buildPaginationUrl={buildPaginationUrl}
                    />
                </CardContent>
            </Card>

            {/* Create Modal — uses BookingForm */}
            <Dialog
                open={isCreateModalOpen}
                onOpenChange={(open) => {
                    setIsCreateModalOpen(open);
                    if (!open) resetCreate();
                }}
            >
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Create Booking</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <BookingForm
                            data={createData}
                            setData={setCreateData}
                            errors={createErrors}
                            customers={customers}
                            rooms={rooms}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={createProcessing}>
                                {createProcessing
                                    ? "Submitting..."
                                    : "Create Booking"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal — UI only edits STATUS; full payload (incl. override flag) */}
            <Dialog
                open={isEditModalOpen}
                onOpenChange={(open) => {
                    setIsEditModalOpen(open);
                    if (!open) {
                        resetEdit();
                        setConfirmOpen(false);
                        pendingStatusRef.current = null;
                    }
                }}
            >
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Edit Booking Status</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleUpdate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right text-sm font-medium">
                                    Status
                                </div>
                                <div className="col-span-3">
                                    <Select
                                        value={editData.status || "reserved"}
                                        onValueChange={handleChangeStatus}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="reserved">
                                                Reserved
                                            </SelectItem>
                                            <SelectItem value="checked_in">
                                                Checked In
                                            </SelectItem>
                                            <SelectItem value="checked_out">
                                                Checked Out
                                            </SelectItem>
                                            <SelectItem value="cancelled">
                                                Cancelled
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {editErrors?.status && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {editErrors.status}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={editProcessing}>
                                {editProcessing ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Future check-in confirmation */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Set to Checked In with a future check-in time?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This booking's check-in time is in the future.
                            Setting it to <b>Checked In</b> can create data
                            inconsistencies. Proceed only if you understand this
                            (e.g., testing or special case). You can change it
                            back later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelFutureCheckin}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmFutureCheckin}>
                            Proceed
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Modal */}
            <DeleteBookingModal
                isOpen={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                onConfirm={handleDelete}
                booking={currentBooking}
            />
        </div>
    );
}

Bookings.layout = (page) => <AuthenticatedLayout children={page} />;
