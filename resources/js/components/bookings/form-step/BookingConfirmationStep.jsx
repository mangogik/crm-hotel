import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const BookingConfirmationStep = ({
    selectedRoom,
    selectedDates,
    customers,
    formData,
    setData,
    errors,
}) => {
    // Fungsi untuk memformat mata uang ke Rupiah
    const formatPrice = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Handler untuk mengubah customer, langsung update state di parent
    const handleCustomerChange = (value) => {
        setData((prevData) => ({
            ...prevData,
            customer_id: value,
        }));
    };

    // Handler untuk mengubah notes, langsung update state di parent
    const handleNotesChange = (e) => {
        const { value } = e.target;
        setData((prevData) => ({
            ...prevData,
            notes: value,
        }));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kolom Kiri: Detail Booking */}
            <Card>
                <CardHeader>
                    <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Room</span>
                        <span className="font-medium">
                            {selectedRoom.room_number} ({selectedRoom.room_type}
                            )
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Check-in</span>
                        <span className="font-medium">
                            {selectedDates.checkin_date}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Check-out</span>
                        <span className="font-medium">
                            {selectedDates.checkout_date}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            Total Nights
                        </span>
                        <span className="font-medium">
                            {selectedRoom.nights}
                        </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span className="text-primary">Total Price</span>
                        <span className="text-primary">
                            {formatPrice(selectedRoom.total_price)}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Kolom Kanan: Detail Pelanggan */}
            <Card>
                <CardHeader>
                    <CardTitle>Customer Details</CardTitle>
                    <CardDescription>
                        Select an existing customer for this booking.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="customer_id">Customer *</Label>
                        <Select
                            value={formData.customer_id || ""}
                            onValueChange={handleCustomerChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((customer) => (
                                    <SelectItem
                                        key={customer.id}
                                        value={customer.id.toString()}
                                    >
                                        {customer.name} -{" "}
                                        {customer.passport_country}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.customer_id && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.customer_id}
                            </p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes || ""}
                            onChange={handleNotesChange}
                            placeholder="Any special requests?"
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default BookingConfirmationStep;
