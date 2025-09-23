import { useState } from "react";
import { usePage } from "@inertiajs/react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, ArrowUpDown, Calendar, TrendingUp, Users, Globe, Star } from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function History() {
    // Dummy data for Order History table
    const historyData = [
        {
            id: 1001,
            customer: "John Doe",
            service: "Spa & Massage",
            date: "2025-09-20",
            status: "completed",
            total: 180000,
            country: "United States"
        },
        {
            id: 1002,
            customer: "Jane Smith",
            service: "Room Service Meal",
            date: "2025-09-19",
            status: "completed",
            total: 80000,
            country: "United Kingdom"
        },
        {
            id: 1003,
            customer: "Robert Johnson",
            service: "Sewa Ruangan Meeting",
            date: "2025-09-18",
            status: "completed",
            total: 400000,
            country: "Australia"
        },
        {
            id: 1004,
            customer: "Maria Garcia",
            service: "Laundry/Dry Cleaning",
            date: "2025-09-17",
            status: "cancelled",
            total: 0,
            country: "Spain"
        },
        {
            id: 1005,
            customer: "Ahmed Hassan",
            service: "Upgrade Bed",
            date: "2025-09-16",
            status: "completed",
            total: 100000,
            country: "Egypt"
        }
    ];

    // Dummy data for Revenue by Country table
    const revenueByCountryData = [
        {
            country: "United States",
            orders: 45,
            revenue: 8500000,
            percentage: 28
        },
        {
            country: "United Kingdom",
            orders: 32,
            revenue: 6200000,
            percentage: 20
        },
        {
            country: "Australia",
            orders: 28,
            revenue: 5400000,
            percentage: 18
        },
        {
            country: "Japan",
            orders: 25,
            revenue: 4800000,
            percentage: 16
        },
        {
            country: "Germany",
            orders: 22,
            revenue: 4200000,
            percentage: 14
        }
    ];

    // Dummy data for Service Popularity table
    const servicePopularityData = [
        {
            service: "Spa & Massage",
            orders: 85,
            revenue: 15300000,
            rating: 4.8
        },
        {
            service: "Room Service Meal",
            orders: 72,
            revenue: 5760000,
            rating: 4.5
        },
        {
            service: "Sewa Ruangan Meeting",
            orders: 45,
            revenue: 9000000,
            rating: 4.7
        },
        {
            service: "Laundry/Dry Cleaning",
            orders: 38,
            revenue: 2280000,
            rating: 4.3
        },
        {
            service: "Upgrade Bed",
            orders: 32,
            revenue: 2560000,
            rating: 4.6
        }
    ];

    // Dummy data for Customer Demographics table
    const customerDemographicsData = [
        {
            country: "United States",
            customers: 125,
            newCustomers: 15,
            percentage: 25
        },
        {
            country: "United Kingdom",
            customers: 98,
            newCustomers: 12,
            percentage: 20
        },
        {
            country: "Australia",
            customers: 85,
            newCustomers: 10,
            percentage: 17
        },
        {
            country: "Japan",
            customers: 72,
            newCustomers: 8,
            percentage: 15
        },
        {
            country: "Germany",
            customers: 65,
            newCustomers: 7,
            percentage: 13
        }
    ];

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedCountry, setSelectedCountry] = useState("all");
    const [sortBy, setSortBy] = useState("date");
    const [sortDirection, setSortDirection] = useState("desc");

    // Filter data based on search and filters
    const filteredData = historyData.filter(item => {
        const matchesSearch = searchTerm === "" || 
            item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toString().includes(searchTerm);
            
        const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;
        const matchesCountry = selectedCountry === "all" || item.country === selectedCountry;
        
        return matchesSearch && matchesStatus && matchesCountry;
    });

    // Sort data
    const sortedData = [...filteredData].sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        // Handle string comparison
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }
        
        if (sortDirection === "asc") {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortDirection("asc");
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedStatus("all");
        setSelectedCountry("all");
        setSortBy("date");
        setSortDirection("desc");
    };

    const formatPrice = (price) => {
        if (!price && price !== 0) return "N/A";
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusBadge = (status) => {
        const variants = {
            pending: "secondary",
            confirmed: "default",
            completed: "outline",
            cancelled: "destructive",
        };
        return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
    };

    const SortableHeader = ({ field, children }) => (
        <TableHead className="cursor-pointer" onClick={() => handleSort(field)}>
            <div className="flex items-center space-x-1">
                <span>{children}</span>
                {sortBy === field && (
                    <ArrowUpDown
                        className={`h-3 w-3 ${
                            sortDirection === "asc" ? "rotate-180" : ""
                        }`}
                    />
                )}
            </div>
        </TableHead>
    );

    // Get unique countries for filter
    const countries = ["all", ...new Set(historyData.map(item => item.country))];

    return (
        <div className="container mx-auto py-2 px-4 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Reports</h1>
                <p className="text-muted-foreground">View comprehensive reports and analytics</p>
            </div>

            {/* Order History Table */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Order History
                        </CardTitle>
                        <CardDescription>
                            Recent order transactions and status
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search orders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select
                                value={selectedStatus}
                                onValueChange={setSelectedStatus}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Statuses
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="confirmed">
                                        Confirmed
                                    </SelectItem>
                                    <SelectItem value="completed">
                                        Completed
                                    </SelectItem>
                                    <SelectItem value="cancelled">
                                        Cancelled
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={selectedCountry}
                                onValueChange={setSelectedCountry}
                            >
                                <SelectTrigger className="w-[180px]">
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
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="flex items-center gap-2"
                            >
                                <X className="h-4 w-4" /> Clear Filters
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableHeader field="id">
                                        Order ID
                                    </SortableHeader>
                                    <SortableHeader field="customer">
                                        Customer
                                    </SortableHeader>
                                    <SortableHeader field="service">
                                        Service
                                    </SortableHeader>
                                    <SortableHeader field="country">
                                        Country
                                    </SortableHeader>
                                    <SortableHeader field="date">
                                        Date
                                    </SortableHeader>
                                    <SortableHeader field="status">
                                        Status
                                    </SortableHeader>
                                    <SortableHeader field="total">
                                        Total
                                    </SortableHeader>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedData.length > 0 ? (
                                    sortedData.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                #{item.id}
                                            </TableCell>
                                            <TableCell>
                                                {item.customer}
                                            </TableCell>
                                            <TableCell>
                                                {item.service}
                                            </TableCell>
                                            <TableCell>
                                                {item.country}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(item.date)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(item.status)}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatPrice(item.total)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center py-8"
                                        >
                                            No order history found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-muted-foreground">
                            Showing {sortedData.length} of {historyData.length} orders
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Revenue by Country Table */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            Revenue by Country
                        </CardTitle>
                        <CardDescription>
                            Revenue breakdown by customer country
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Country</TableHead>
                                    <TableHead className="text-right">Orders</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead className="text-right">Percentage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {revenueByCountryData.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            {item.country}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.orders}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatPrice(item.revenue)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-blue-600 h-2 rounded-full" 
                                                        style={{ width: `${item.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span>{item.percentage}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Service Popularity Table */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5" />
                            Service Popularity
                        </CardTitle>
                        <CardDescription>
                            Most popular services and customer ratings
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead className="text-right">Orders</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead className="text-right">Rating</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {servicePopularityData.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            {item.service}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.orders}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatPrice(item.revenue)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <span>{item.rating}</span>
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Customer Demographics Table */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Customer Demographics
                        </CardTitle>
                        <CardDescription>
                            Customer distribution by country
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Country</TableHead>
                                    <TableHead className="text-right">Customers</TableHead>
                                    <TableHead className="text-right">New Customers</TableHead>
                                    <TableHead className="text-right">Percentage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customerDemographicsData.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            {item.country}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.customers}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-green-600">+{item.newCustomers}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-green-600 h-2 rounded-full" 
                                                        style={{ width: `${item.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span>{item.percentage}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

History.layout = (page) => <AuthenticatedLayout children={page} />;