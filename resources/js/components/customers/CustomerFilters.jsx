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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

const CustomerFilters = ({
    searchTerm,
    setSearchTerm,
    selectedCountry,
    setSelectedCountry,
    selectedMembership,
    setSelectedMembership,
    lastVisitFrom,
    setLastVisitFrom,
    lastVisitTo,
    setLastVisitTo,
    clearFilters,
    countries,
}) => {
    const membershipTypes = [
        { value: "all", label: "All Memberships" },
        { value: "regular", label: "Regular" },
        { value: "silver", label: "Silver" },
        { value: "gold", label: "Gold" },
        { value: "platinum", label: "Platinum" },
    ];

    const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
    const [tempFromDate, setTempFromDate] = useState(lastVisitFrom);
    const [tempToDate, setTempToDate] = useState(lastVisitTo);

    const applyDateRange = () => {
        setLastVisitFrom(tempFromDate);
        setLastVisitTo(tempToDate);
        setIsDateDialogOpen(false);
    };

    const clearDateRange = () => {
        setTempFromDate("");
        setTempToDate("");
        setLastVisitFrom("");
        setLastVisitTo("");
        setIsDateDialogOpen(false);
    };

    const getDateRangeLabel = () => {
        if (!lastVisitFrom && !lastVisitTo) return "Select Last Visit Range";
        if (lastVisitFrom && !lastVisitTo) return lastVisitFrom;
        if (lastVisitFrom && lastVisitTo) {
            return `${lastVisitFrom} - ${lastVisitTo}`;
        }
        return "Select Last Visit Range";
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            <div className="flex flex-wrap gap-2">
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                        {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                                {country === "all" ? "All Countries" : country}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={selectedMembership} onValueChange={setSelectedMembership}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Membership" />
                    </SelectTrigger>
                    <SelectContent>
                        {membershipTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                
                {/* Date Range Picker Dialog */}
                <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full md:w-52 justify-center text-left font-normal"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {getDateRangeLabel()}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-96">
                        <DialogHeader>
                            <DialogTitle>Select Last Visit Range</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="from-date">From Date</Label>
                                <Input
                                    id="from-date"
                                    type="date"
                                    value={tempFromDate}
                                    onChange={(e) => setTempFromDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="to-date">To Date</Label>
                                <Input
                                    id="to-date"
                                    type="date"
                                    value={tempToDate}
                                    onChange={(e) => setTempToDate(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-between">
                                <Button variant="outline" onClick={clearDateRange}>
                                    Clear
                                </Button>
                                <Button onClick={applyDateRange}>
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                
                <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                    <X className="h-4 w-4" /> Clear
                </Button>
            </div>
        </div>
    );
};

export default CustomerFilters;