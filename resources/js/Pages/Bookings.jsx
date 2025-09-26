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

import BookingHeader from "@/components/bookings/BookingHeader";
import BookingFilters from "@/components/bookings/BookingFilters";
import BookingsTable from "@/components/bookings/BookingsTable";
import BookingForm from "@/components/bookings/BookingForm";
import DeleteBookingModal from "@/components/bookings/DeleteBookingModal";
import Pagination from "@/components/bookings/Pagination";
import DateSelectionStep from "@/components/bookings/form-step/DateSelectionStep";
import RoomSelectionStep from "@/components/bookings/form-step/RoomSelectionStep";
import BookingConfirmationStep from "@/components/bookings/form-step/BookingConfirmationStep";

export default function Bookings() {
    const { bookings, filters, flash, customers, rooms } = usePage().props;

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
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentBooking, setCurrentBooking] = useState(null);
    const [expandedRows, setExpandedRows] = useState([]);

    // Multi-step booking state
    const [bookingStep, setBookingStep] = useState(1);
    const [selectedDates, setSelectedDates] = useState(null);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            customer_id: "",
            room_id: "",
            checkin_at: "",
            checkout_at: "",
            status: "reserved",
            notes: "",
        });

    // --- PERUBAHAN UTAMA SELESAI DI SINI ---

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        const timer = setTimeout(() => applyFilters(1), 500);
        return () => clearTimeout(timer);
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

    const nextStep = () => {
        setBookingStep((prev) => prev + 1);
    };

    const handleSort = (field) => {
        setSortBy(field);
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    };

    const resetBookingFlow = () => {
        setBookingStep(1);
        setSelectedDates(null);
        setAvailableRooms([]);
        setSelectedRoomForBooking(null);
        reset();
        clearErrors();
    };

    const openCreateModal = () => {
        resetBookingFlow();
        setIsCreateModalOpen(true);
    };

    const openEditModal = (booking) => {
        setData({
            customer_id: booking.customer_id.toString(),
            room_id: booking.room_id.toString(),
            checkin_at: booking.checkin_at,
            checkout_at: booking.checkout_at,
            status: booking.status,
            notes: booking.notes || "",
        });
        clearErrors();
        setCurrentBooking(booking);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (booking) => {
        setCurrentBooking(booking);
        setIsDeleteModalOpen(true);
    };

    const handleCreate = () => {
        const finalBookingData = {
            ...data,
            room_id: selectedRoomForBooking.id,
            checkin_at: selectedDates.checkin_date,
            checkout_at: selectedDates.checkout_date,
            status: "reserved",
        };

        console.log("Submitting with router.post:", finalBookingData);

        // 2. Gunakan `router.post` untuk mengirim objek data final tersebut
        router.post(route("bookings.store"), finalBookingData, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetBookingFlow();
                toast.success("Booking created successfully!");
            },
            onError: (errors) => {
                console.error("Validation errors:", errors);
                const firstError = Object.values(errors)[0];
                toast.error(firstError || "Failed to create booking.");
            },
        });
    };
    const handleUpdate = (e) => {
        e.preventDefault();
        put(route("bookings.update", currentBooking.id), {
            onSuccess: () => setIsEditModalOpen(false),
        });
    };

    const handleDelete = () => {
        router.delete(route("bookings.destroy", currentBooking.id), {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
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

    const formatDate = (dateString) =>
        dateString ? new Date(dateString).toLocaleDateString() : "N/A";
    const formatDateTime = (dateString) =>
        dateString ? new Date(dateString).toLocaleString() : "N/A";
    const toggleRow = (id) =>
        setExpandedRows((prev) =>
            prev.includes(id)
                ? prev.filter((rowId) => rowId !== id)
                : [...prev, id]
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

            {/* Multi-step Booking Modal */}
            <Dialog
                open={isCreateModalOpen}
                onOpenChange={(open) => {
                    setIsCreateModalOpen(open);
                    if (!open) resetBookingFlow();
                }}
            >
                <DialogContent
                    className={`${
                        bookingStep === 2 ? "sm:max-w-[1200px]" : ""
                    } max-h-[90vh] overflow-y-auto`}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {bookingStep === 1 && "Select Dates & Preferences"}
                            {bookingStep === 2 && "Select Room"}
                            {bookingStep === 3 && "Confirm Booking"}
                        </DialogTitle>
                        <DialogDescription>
                            {bookingStep === 1 &&
                                "Choose your check-in and check-out dates"}
                            {bookingStep === 2 &&
                                `Available rooms for ${selectedDates?.checkin_date} to ${selectedDates?.checkout_date}`}
                            {bookingStep === 3 && "Review your booking details"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {bookingStep === 1 && (
                            <DateSelectionStep
                                onDateSelected={(dates) =>
                                    setSelectedDates(dates)
                                }
                                onRoomsFound={(rooms) =>
                                    setAvailableRooms(rooms)
                                }
                                onNextStep={nextStep}
                            />
                        )}

                        {bookingStep === 2 && (
                            <RoomSelectionStep
                                rooms={availableRooms}
                                selectedDates={selectedDates}
                                onRoomSelected={(room) =>
                                    setSelectedRoomForBooking(room)
                                }
                                onNextStep={nextStep}
                            />
                        )}

                        {bookingStep === 3 && (
                            <BookingConfirmationStep
                                selectedRoom={selectedRoomForBooking}
                                selectedDates={selectedDates}
                                customers={customers}
                                formData={data}
                                setData={setData}
                                errors={errors}
                            />
                        )}
                    </div>

                    <DialogFooter className="flex justify-between">
                        <div>
                            {bookingStep > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setBookingStep(bookingStep - 1)
                                    }
                                >
                                    Back
                                </Button>
                            )}
                        </div>
                        <div>
                            {bookingStep === 1 && availableRooms.length > 0 && (
                                <Button onClick={() => setBookingStep(2)}>
                                    View Available Rooms (
                                    {availableRooms.length})
                                </Button>
                            )}
                            {bookingStep === 2 && selectedRoomForBooking && (
                                <Button onClick={() => setBookingStep(3)}>
                                    Continue to Confirmation
                                </Button>
                            )}
                            {bookingStep === 3 && (
                                <Button
                                    onClick={handleCreate}
                                    disabled={!data.customer_id || processing}
                                >
                                    {processing
                                        ? "Submitting..."
                                        : "Confirm Booking"}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal (existing single-step form) */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Booking</DialogTitle>
                        <DialogDescription>
                            Update booking information
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate}>
                        <BookingForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            customers={customers}
                            rooms={rooms}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={processing}>
                                Update Booking
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
