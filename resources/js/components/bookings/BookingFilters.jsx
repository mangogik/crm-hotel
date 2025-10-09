import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

const BookingFilters = ({
    searchTerm,
    setSearchTerm,
    selectedCustomer,
    setSelectedCustomer,
    selectedRoom,
    setSelectedRoom,
    selectedStatus,
    setSelectedStatus,
    checkinDateFrom,
    setCheckinDateFrom,
    checkinDateTo,
    setCheckinDateTo,
    checkoutDateFrom,
    setCheckoutDateFrom,
    checkoutDateTo,
    setCheckoutDateTo,
    clearFilters,
    customers,
    rooms,
}) => {
    const bookingStatuses = [
        { value: "all", label: "All Statuses" },
        { value: "reserved", label: "Reserved" },
        { value: "checked_in", label: "Checked In" },
        { value: "checked_out", label: "Checked Out" },
        { value: "cancelled", label: "Cancelled" },
    ];

    const [isCheckinDateDialogOpen, setIsCheckinDateDialogOpen] =
        useState(false);
    const [isCheckoutDateDialogOpen, setIsCheckoutDateDialogOpen] =
        useState(false);
    const [tempCheckinFromDate, setTempCheckinFromDate] =
        useState(checkinDateFrom);
    const [tempCheckinToDate, setTempCheckinToDate] = useState(checkinDateTo);
    const [tempCheckoutFromDate, setTempCheckoutFromDate] =
        useState(checkoutDateFrom);
    const [tempCheckoutToDate, setTempCheckoutToDate] =
        useState(checkoutDateTo);

    const applyCheckinDateRange = () => {
        setCheckinDateFrom(tempCheckinFromDate);
        setCheckinDateTo(tempCheckinToDate);
        setIsCheckinDateDialogOpen(false);
    };

    const applyCheckoutDateRange = () => {
        setCheckoutDateFrom(tempCheckoutFromDate);
        setCheckoutDateTo(tempCheckoutToDate);
        setIsCheckoutDateDialogOpen(false);
    };

    const clearCheckinDateRange = () => {
        setTempCheckinFromDate("");
        setTempCheckinToDate("");
        setCheckinDateFrom("");
        setCheckinDateTo("");
        setIsCheckinDateDialogOpen(false);
    };

    const clearCheckoutDateRange = () => {
        setTempCheckoutFromDate("");
        setTempCheckoutToDate("");
        setCheckoutDateFrom("");
        setCheckoutDateTo("");
        setIsCheckoutDateDialogOpen(false);
    };

    const getCheckinDateRangeLabel = () => {
        if (!checkinDateFrom && !checkinDateTo) return "Check-in Date";
        if (checkinDateFrom && !checkinDateTo) return checkinDateFrom;
        if (checkinDateFrom && checkinDateTo) {
            return `${checkinDateFrom} - ${checkinDateTo}`;
        }
        return "Check-in Date";
    };

    const getCheckoutDateRangeLabel = () => {
        if (!checkoutDateFrom && !checkoutDateTo) return "Check-out Date";
        if (checkoutDateFrom && !checkoutDateTo) return checkoutDateFrom;
        if (checkoutDateFrom && checkoutDateTo) {
            return `${checkoutDateFrom} - ${checkoutDateTo}`;
        }
        return "Check-out Date";
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* 1. Div untuk Search Bar (1/3 Lebar) */}
            <div className="relative md:w-1/3">
                {" "}
                {/* DIUBAH: Hapus 'flex-1' dan ganti dengan 'md:w-1/3' */}
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Search by customer or room..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* 2. Div untuk Grup Filter (2/3 Lebar) */}
            <div className="flex flex-wrap gap-2 md:w-2/3">
                {" "}
                {/* DIUBAH: Tambahkan 'md:w-2/3' */}
                <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                >
                    <SelectTrigger className="w-full sm:w-auto flex-grow">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {bookingStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                                {status.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Dialog
                    open={isCheckinDateDialogOpen}
                    onOpenChange={setIsCheckinDateDialogOpen}
                >
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto flex-grow justify-center text-left font-normal"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {getCheckinDateRangeLabel()}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-96">
                        <DialogHeader>
                            <DialogTitle>
                                Select Check-in Date Range
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="from-date">From</Label>
                                <Input
                                    id="from-date"
                                    type="date"
                                    value={tempCheckinFromDate}
                                    onChange={(e) =>
                                        setTempCheckinFromDate(e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="to-date">To</Label>
                                <Input
                                    id="to-date"
                                    type="date"
                                    value={tempCheckinToDate}
                                    onChange={(e) =>
                                        setTempCheckinToDate(e.target.value)
                                    }
                                />
                            </div>
                            <div className="flex justify-between">
                                <Button
                                    variant="outline"
                                    onClick={clearCheckinDateRange}
                                >
                                    Clear
                                </Button>
                                <Button onClick={applyCheckinDateRange}>
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                <Dialog
                    open={isCheckoutDateDialogOpen}
                    onOpenChange={setIsCheckoutDateDialogOpen}
                >
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto flex-grow justify-center text-left font-normal"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {getCheckoutDateRangeLabel()}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-96">
                        <DialogHeader>
                            <DialogTitle>
                                Select Check-out Date Range
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            {/* DIPERBAIKI: Menggunakan state setter yang benar */}
                            <div className="space-y-2">
                                <Label htmlFor="from-date">From</Label>
                                <Input
                                    id="from-date"
                                    type="date"
                                    value={tempCheckoutFromDate}
                                    onChange={(e) =>
                                        setTempCheckoutFromDate(e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="to-date">To</Label>
                                <Input
                                    id="to-date"
                                    type="date"
                                    value={tempCheckoutToDate}
                                    onChange={(e) =>
                                        setTempCheckoutToDate(e.target.value)
                                    }
                                />
                            </div>
                            <div className="flex justify-between">
                                <Button
                                    variant="outline"
                                    onClick={clearCheckoutDateRange}
                                >
                                    Clear
                                </Button>
                                <Button onClick={applyCheckoutDateRange}>
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                >
                    <X className="h-4 w-4" /> Clear
                </Button>
            </div>
        </div>
    );
};

export default BookingFilters;
