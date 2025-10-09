import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PaymentFilters = ({
    search,
    setSearch,
    status,
    setStatus,
    method,
    setMethod,
    dateRange,
    setDateRange,
    clearFilters,
}) => {
    return (
        <Card className="mb-6">
            <CardContent>
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search by customer, email, phone, or payment ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="refunded">
                                    Refunded
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Methods</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="online">Online</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            type="date"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-auto"
                        />
                        <Button variant="outline" onClick={clearFilters}>
                            Clear
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PaymentFilters;
