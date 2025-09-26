// resources/js/components/bookings/DateSelectionStep.jsx
import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Filter } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const DateSelectionStep = ({ onRoomsFound, onDateSelected, onNextStep }) => {
    const [dates, setDates] = useState({ checkin_date: "", checkout_date: "" });
    const [filters, setFilters] = useState({
        room_type: "",
        capacity: "",
        min_price: "",
        max_price: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [availability, setAvailability] = useState(null);

    const checkAvailability = async () => {
        if (!dates.checkin_date || !dates.checkout_date) {
            toast.error("Please select both check-in and check-out dates.");
            return;
        }

        setIsLoading(true);
        setAvailability(null);

        try {
            const params = { ...dates, ...filters };
            Object.keys(params).forEach(
                (key) =>
                    (params[key] === "" || params[key] === null) &&
                    delete params[key]
            );

            const response = await axios.get(
                "/api/bookings/check-availability",
                { params }
            );

            setAvailability(response.data);
            onRoomsFound(response.data.rooms);
            onDateSelected(dates);

            if (response.data.rooms.length > 0) {
                toast.success(
                    `Found ${response.data.rooms.length} available rooms.`
                );
                onNextStep();
            } else {
                toast.info(
                    "No rooms match your criteria for the selected dates."
                );
            }
        } catch (error) {
            const message =
                error.response?.data?.message ||
                "Failed to check availability.";
            toast.error(message);
            console.error("Availability check error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (filterName, value) => {
        const finalValue = value === "all" ? "" : value;
        setFilters((prev) => ({ ...prev, [filterName]: finalValue }));
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Select Dates & Preferences
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Date Selection - Compact Layout */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Stay Dates</span>
                        </div>

                        <div className="flex flex-row gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="checkin_date">Check-in *</Label>
                                <Input
                                    id="checkin_date"
                                    type="date"
                                    value={dates.checkin_date}
                                    onChange={(e) =>
                                        setDates({
                                            ...dates,
                                            checkin_date: e.target.value,
                                        })
                                    }
                                    min={new Date().toISOString().split("T")[0]}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="checkout_date">
                                    Check-out *
                                </Label>
                                <Input
                                    id="checkout_date"
                                    type="date"
                                    value={dates.checkout_date}
                                    onChange={(e) =>
                                        setDates({
                                            ...dates,
                                            checkout_date: e.target.value,
                                        })
                                    }
                                    min={
                                        dates.checkin_date ||
                                        new Date().toISOString().split("T")[0]
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filters - Compact Layout */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                                Room Preferences
                            </span>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex flex-row gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="room_type">Room Type</Label>
                                    <Select
                                        value={filters.room_type || "all"}
                                        onValueChange={(value) =>
                                            handleFilterChange(
                                                "room_type",
                                                value
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All types
                                            </SelectItem>
                                            <SelectItem value="Standard">
                                                Standard
                                            </SelectItem>
                                            <SelectItem value="Deluxe">
                                                Deluxe
                                            </SelectItem>
                                            <SelectItem value="Suite">
                                                Suite
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="capacity">Capacity</Label>
                                    <Select
                                        value={filters.capacity || "all"}
                                        onValueChange={(value) =>
                                            handleFilterChange(
                                                "capacity",
                                                value
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Any" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Any capacity
                                            </SelectItem>
                                            <SelectItem value="1">
                                                1 Guest
                                            </SelectItem>
                                            <SelectItem value="2">
                                                2 Guests
                                            </SelectItem>
                                            <SelectItem value="4">
                                                4+ Guests
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex flex-row gap-4">
                                <div className="flex-1 space-y-1">
                                    <Label htmlFor="min_price">Min Price</Label>
                                    <Input
                                        id="min_price"
                                        type="number"
                                        placeholder="0"
                                        value={filters.min_price}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                min_price: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Label htmlFor="max_price">Max Price</Label>
                                    <Input
                                        id="max_price"
                                        type="number"
                                        placeholder="No limit"
                                        value={filters.max_price}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                max_price: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button
                onClick={checkAvailability}
                disabled={isLoading}
                className="w-full"
            >
                {isLoading ? "Checking..." : "Check Availability"}
            </Button>
        </div>
    );
};

export default DateSelectionStep;
