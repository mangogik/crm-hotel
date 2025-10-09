import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

const ServiceFilters = ({
    searchTerm,
    setSearchTerm,
    selectedType,
    setSelectedType,
    selectedFulfillment,
    setSelectedFulfillment,
    selectedOfferingSession, // New prop
    setSelectedOfferingSession, // New prop
    clearFilters,
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            <div className="flex gap-2 flex-wrap">
                <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                        <SelectItem value="per_unit">Per Unit</SelectItem>
                        <SelectItem value="selectable">Selectable</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={selectedFulfillment} onValueChange={setSelectedFulfillment}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Fulfillment" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Fulfillments</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="staff_assisted">Staff Assisted</SelectItem>
                    </SelectContent>
                </Select>
                {/* New filter for offering session */}
                <Select value={selectedOfferingSession} onValueChange={setSelectedOfferingSession}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Session" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sessions</SelectItem>
                        <SelectItem value="pre_checkin">Pre Check-in</SelectItem>
                        <SelectItem value="post_checkin">Post Check-in</SelectItem>
                        <SelectItem value="pre_checkout">Pre Checkout</SelectItem>
                    </SelectContent>
                </Select>
                <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                >
                    <X className="h-4 w-4" /> Clear Sort & Filters
                </Button>
            </div>
        </div>
    );
};

export default ServiceFilters;