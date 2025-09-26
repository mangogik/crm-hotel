import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

const RoomFilters = ({
    searchTerm, setSearchTerm,
    selectedStatus, setSelectedStatus,
    selectedType, setSelectedType,
    clearFilters,
}) => {

    const roomTypes = ["all", "Standard", "Deluxe", "Suite", "Family Room", "Penthouse"];
    const roomStatuses = ["all", "available", "occupied", "maintenance"];

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Search by room number or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            <div className="flex flex-wrap gap-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Room Type" />
                    </SelectTrigger>
                    <SelectContent>
                        {roomTypes.map(type => (
                            <SelectItem key={type} value={type}>
                                {type === 'all' ? 'All Types' : type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {roomStatuses.map(status => (
                            <SelectItem key={status} value={status} className="capitalize">
                                {status === 'all' ? 'All Statuses' : status}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                    <X className="h-4 w-4" /> Clear
                </Button>
            </div>
        </div>
    );
};

export default RoomFilters;
