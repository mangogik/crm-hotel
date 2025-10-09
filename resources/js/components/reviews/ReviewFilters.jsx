// resources/js/components/reviews/ReviewFilters.jsx
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
import {
    Search,
    Filter,
    X,
    Calendar as CalendarIcon,
    Star,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "../ui/card";

const ReviewFilters = ({
    search,
    setSearch,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    minRating,
    setMinRating,
    clearFilters,
}) => {
    const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
    const [tempDateFrom, setTempDateFrom] = useState(dateFrom);
    const [tempDateTo, setTempDateTo] = useState(dateTo);

    const applyDateRange = () => {
        setDateFrom(tempDateFrom);
        setDateTo(tempDateTo);
        setIsDateDialogOpen(false);
    };

    const clearDateRange = () => {
        setTempDateFrom("");
        setTempDateTo("");
        setDateFrom("");
        setDateTo("");
        setIsDateDialogOpen(false);
    };

    const getDateRangeLabel = () => {
        if (!dateFrom && !dateTo) return "Review Date";
        if (dateFrom && !dateTo) return dateFrom;
        if (dateFrom && dateTo) {
            return `${dateFrom} - ${dateTo}`;
        }
        return "Review Date";
    };

    return (
        <Card className="mb-6">
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Bar (50% width) */}
                    <div className="relative md:w-1/2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search reviews or customers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filter Group (50% width) */}
                    <div className="flex flex-wrap gap-2 md:w-1/2">
                        {/* Minimum Rating Dropdown - First */}
                        <Select
                            value={minRating?.toString() || "0"}
                            onValueChange={(value) =>
                                setMinRating(parseInt(value))
                            }
                        >
                            <SelectTrigger className="w-full sm:w-auto flex-grow">
                                <Star className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Min Rating" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">All Ratings</SelectItem>
                                <SelectItem value="1">1+ Stars</SelectItem>
                                <SelectItem value="2">2+ Stars</SelectItem>
                                <SelectItem value="3">3+ Stars</SelectItem>
                                <SelectItem value="4">4+ Stars</SelectItem>
                                <SelectItem value="5">5 Stars</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Created Date Range Dialog - Second */}
                        <Dialog
                            open={isDateDialogOpen}
                            onOpenChange={setIsDateDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-auto flex-grow justify-center text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {getDateRangeLabel()}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-96">
                                <DialogHeader>
                                    <DialogTitle>
                                        Select Created Date Range
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date-from">From</Label>
                                        <Input
                                            id="date-from"
                                            type="date"
                                            value={tempDateFrom}
                                            onChange={(e) =>
                                                setTempDateFrom(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date-to">To</Label>
                                        <Input
                                            id="date-to"
                                            type="date"
                                            value={tempDateTo}
                                            onChange={(e) =>
                                                setTempDateTo(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="flex justify-between">
                                        <Button
                                            variant="outline"
                                            onClick={clearDateRange}
                                        >
                                            Clear
                                        </Button>
                                        <Button onClick={applyDateRange}>
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
            </CardContent>
        </Card>
    );
};

export default ReviewFilters;
