// resources/js/components/bookings/BookingForm.jsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const BookingForm = ({ data, setData, errors, customers, rooms }) => {
    const bookingStatuses = [
        { value: "reserved", label: "Reserved" },
        { value: "checked_in", label: "Checked In" },
        { value: "checked_out", label: "Checked Out" },
        { value: "cancelled", label: "Cancelled" },
    ];

    return (
        <div className="grid gap-4 py-4">
            {console.log("ini booking form", data)}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer_id" className="text-right">Customer *</Label>
                <Select
                    id="customer_id"
                    value={data.customer_id || ""}
                    onValueChange={(value) => setData("customer_id", value)}
                    className="col-span-3"
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                        {customers.map((customer) => (
                            <SelectItem 
                                key={customer.id} 
                                value={customer.id ? customer.id.toString() : ""}
                            >
                                {customer.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.customer_id && (
                    <p className="text-red-500 text-sm col-span-4 text-right">
                        {errors.customer_id}
                    </p>
                )}
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room_id" className="text-right">Room *</Label>
                <Select
                    id="room_id"
                    value={data.room_id || ""}
                    onValueChange={(value) => setData("room_id", value)}
                    className="col-span-3"
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                        {rooms.map((room) => (
                            <SelectItem 
                                key={room.id} 
                                value={room.id ? room.id.toString() : ""}
                            >
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
            
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="checkin_at" className="text-right">Check-in *</Label>
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
            
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="checkout_at" className="text-right">Check-out *</Label>
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
            
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status *</Label>
                <Select
                    id="status"
                    value={data.status || ""}
                    onValueChange={(value) => setData("status", value)}
                    className="col-span-3"
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        {bookingStatuses.map((status) => (
                            <SelectItem 
                                key={status.value} 
                                value={status.value || ""}
                            >
                                {status.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.status && (
                    <p className="text-red-500 text-sm col-span-4 text-right">
                        {errors.status}
                    </p>
                )}
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">Notes</Label>
                <Input
                    id="notes"
                    type="text"
                    value={data.notes || ""}
                    onChange={(e) => setData("notes", e.target.value)}
                    className="col-span-3"
                />
                {errors.notes && (
                    <p className="text-red-500 text-sm col-span-4 text-right">
                        {errors.notes}
                    </p>
                )}
            </div>
        </div>
    );
};

export default BookingForm;