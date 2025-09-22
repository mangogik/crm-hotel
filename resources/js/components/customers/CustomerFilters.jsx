import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X, Calendar } from "lucide-react";

const CustomerFilters = ({
    searchTerm,
    setSearchTerm,
    selectedCountry,
    setSelectedCountry,
    checkinDateFilter,
    setCheckinDateFilter,
    checkoutDateFilter,
    setCheckoutDateFilter,
    clearFilters,
    countries,
}) => {
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
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        type="date"
                        placeholder="Check-in"
                        value={checkinDateFilter}
                        onChange={(e) => setCheckinDateFilter(e.target.value)}
                        className="pl-10 w-full"
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        type="date"
                        placeholder="Check-out"
                        value={checkoutDateFilter}
                        onChange={(e) => setCheckoutDateFilter(e.target.value)}
                        className="pl-10 w-full"
                    />
                </div>
                <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                    <X className="h-4 w-4" /> Clear
                </Button>
            </div>
        </div>
    );
};

export default CustomerFilters;
