import { useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";

// helper tanggal lokal
const toLocalDate = (dt) => {
    if (!dt) return null;
    const d = new Date(dt);
    if (isNaN(d)) return null;
    return d;
};
const isTodayLocal = (dt) => {
    const d = toLocalDate(dt);
    if (!d) return false;
    const now = new Date();
    return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    );
};
const isFutureLocal = (dt) => {
    const d = toLocalDate(dt);
    if (!d) return false;
    const now = new Date();
    return d.getTime() > now.getTime() && !isTodayLocal(dt);
};

const BookingForm = ({ data, setData, errors, customers, rooms }) => {
    // Hitung apakah check-in hari ini / masa depan
    const checkinIsToday = useMemo(
        () => isTodayLocal(data.checkin_at),
        [data.checkin_at]
    );
    const checkinIsFuture = useMemo(
        () => isFutureLocal(data.checkin_at),
        [data.checkin_at]
    );

    // Enforce status otomatis berdasar checkin_at
    useEffect(() => {
        if (checkinIsFuture) {
            // Masa depan: fix ke reserved
            if (data.status !== "reserved") setData("status", "reserved");
        } else if (checkinIsToday) {
            // Hari ini: boleh reserved / checked_in, default reserved
            if (!["reserved", "checked_in"].includes(data.status)) {
                setData("status", "reserved");
            }
        } else {
            // (Tanggal lampau atau kosong) — fallback aman: reserved
            if (data.status !== "reserved") setData("status", "reserved");
        }
    }, [checkinIsToday, checkinIsFuture]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="grid gap-4 py-4">
            {/* Customer */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer_id" className="text-right">
                    Customer *
                </Label>
                <div className="col-span-3 flex gap-2">
                    <Select
                        id="customer_id"
                        value={data.customer_id ? String(data.customer_id) : ""}
                        onValueChange={(value) => setData("customer_id", value)}
                        className="min-w-0 flex-1"
                    >
                        <SelectTrigger className="min-w-0">
                            <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers.map((customer) => (
                                <SelectItem
                                    key={customer.id}
                                    value={String(customer.id)}
                                >
                                    {customer.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>


                    <Button
                        type="button"
                        variant="outline"
                        className="whitespace-nowrap"
                        // onClick={() => {}
                    >
                        + Add Customer
                    </Button>
                </div>
                {errors.customer_id && (
                    <p className="text-red-500 text-sm col-span-4 text-right">
                        {errors.customer_id}
                    </p>
                )}
            </div>

            {/* Source */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="source" className="text-right">
                    Source *
                </Label>
                <Select
                    id="source"
                    value={data.source || "direct"}
                    onValueChange={(value) => setData("source", value)}
                    className="col-span-3"
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="ota">OTA</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                </Select>
                {errors.source && (
                    <p className="text-red-500 text-sm col-span-4 text-right">
                        {errors.source}
                    </p>
                )}
            </div>

            {/* Room */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room_id" className="text-right">
                    Room *
                </Label>
                <Select
                    id="room_id"
                    value={data.room_id ? String(data.room_id) : ""}
                    onValueChange={(value) => setData("room_id", value)}
                    className="col-span-3"
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                        {rooms.map((room) => (
                            <SelectItem key={room.id} value={String(room.id)}>
                                {room.room_number} - {room.room_type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.room_id && (
                    <p className="text-red-500 text-sm col-span-4 text-right">
                        {errors.room_id}
                    </p>
                )}
            </div>

            {/* Check-in */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="checkin_at" className="text-right">
                    Check-in *
                </Label>
                <Input
                    id="checkin_at"
                    type="datetime-local"
                    value={data.checkin_at || ""}
                    onChange={(e) => setData("checkin_at", e.target.value)}
                    className="col-span-3"
                />
                {errors.checkin_at && (
                    <p className="text-red-500 text-sm col-span-4 text-right">
                        {errors.checkin_at}
                    </p>
                )}
            </div>

            {/* Check-out */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="checkout_at" className="text-right">
                    Check-out *
                </Label>
                <Input
                    id="checkout_at"
                    type="datetime-local"
                    value={data.checkout_at || ""}
                    onChange={(e) => setData("checkout_at", e.target.value)}
                    className="col-span-3"
                />
                {errors.checkout_at && (
                    <p className="text-red-500 text-sm col-span-4 text-right">
                        {errors.checkout_at}
                    </p>
                )}
            </div>

            {/* Status (HANYA muncul jika checkin_at adalah HARI INI) */}
            {checkinIsToday && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                        Status *
                    </Label>
                    <Select
                        id="status"
                        value={data.status || "reserved"}
                        onValueChange={(value) => setData("status", value)}
                        className="col-span-3"
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="reserved">Reserved</SelectItem>
                            <SelectItem value="checked_in">
                                Checked In
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.status && (
                        <p className="text-red-500 text-sm col-span-4 text-right">
                            {errors.status}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default BookingForm;
