import { Button } from "@/components/ui/button";
import {
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";

const BookingHeader = ({ onAddBooking }) => {
    return (
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-2xl font-bold">Bookings</CardTitle>
                    <CardDescription>Manage your hotel bookings</CardDescription>
                </div>
                <Button onClick={onAddBooking} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add Booking
                </Button>
            </div>
        </CardHeader>
    );
};

export default BookingHeader;