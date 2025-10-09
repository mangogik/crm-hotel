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
import { Card, CardContent } from "../ui/card";

const PromotionFilters = ({
    search,
    setSearch,
    type,
    setType,
    active,
    setActive,
    clearFilters,
}) => {
    return (
        <Card className="mb-6">
            <CardContent>
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search promotions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="birthday">
                                    Birthday
                                </SelectItem>
                                <SelectItem value="event">Event</SelectItem>
                                <SelectItem value="membership">
                                    Membership
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={active} onValueChange={setActive}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Active" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="1">Active</SelectItem>
                                <SelectItem value="0">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
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

export default PromotionFilters;
