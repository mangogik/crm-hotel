import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    Calendar,
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    BedDouble,
    Download,
    Clock,
    CheckCircle2,
    CreditCard,
    BedSingle,
    XCircle,
    MessageSquare,
    Activity,
} from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Reports() {
    const { props } = usePage();
    const {
        filters,
        period,
        stats,
        revenueChartData = [],
        revenueBySource = [],
        servicePerformance = [],
        guestDemographics = [],
        bookingDetails = [],
        recentActivity = [],
        topGuests = [],
    } = props;

    const [range, setRange] = useState(filters?.range || "this_month");
    const [startDate, setStartDate] = useState(filters?.start_date || "");
    const [endDate, setEndDate] = useState(filters?.end_date || "");

    const formatPrice = (val) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val || 0);

    const changePill = (value) => {
        const positive = value >= 0;
        const Icon = positive ? TrendingUp : TrendingDown;
        return (
            <span
                className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1 ${
                    positive
                        ? "text-green-700 bg-green-100"
                        : "text-red-700 bg-red-100"
                }`}
            >
                <Icon className="h-3 w-3" />
                {positive ? `+${value}%` : `${value}%`}
            </span>
        );
    };

    const COLORS = [
        "#0088FE",
        "#00C49F",
        "#FFBB28",
        "#FF8042",
        "#7C4DFF",
        "#E91E63",
        "#4CAF50",
        "#9C27B0",
    ];

    const onApply = () => {
        const params = { range };
        if (range === "custom") {
            params.start_date = startDate;
            params.end_date = endDate;
        }
        router.get(route("reports.index"), params, {
            preserveState: true,
            replace: true,
        });
    };

    const onExport = () => {
        const url = route("reports.export", {
            range,
            start: range === "custom" ? startDate : period.start,
            end: range === "custom" ? endDate : period.end,
        });
        window.location.href = url;
    };

    const activityIcon = (type) => {
        switch ((type || "").toLowerCase()) {
            case "checked_in":
            case "checkin":
                return <BedSingle className="h-4 w-4 text-blue-500" />;
            case "checked_out":
            case "checkout":
                return <BedDouble className="h-4 w-4 text-green-500" />;
            case "payment_processed":
            case "paid":
                return <CreditCard className="h-4 w-4 text-purple-500" />;
            case "order_confirmed":
            case "confirmed":
                return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case "cancelled":
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <MessageSquare className="h-4 w-4 text-gray-500" />;
        }
    };

    const shortDate = (d) => new Date(d).toLocaleDateString();
    const timeAgo = (d) => {
        const diff = (new Date().getTime() - new Date(d).getTime()) / 1000;
        if (diff < 60) return `${Math.floor(diff)}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const kpiCards = [
        {
            title: "Total Revenue",
            value: formatPrice(stats?.revenue?.current || 0),
            icon: DollarSign,
            change: stats?.revenue?.change,
            description: "From Last Week",
        },
        {
            title: "Orders Completed",
            value: stats?.ordersCompleted?.current || 0,
            icon: CheckCircle2,
            change: stats?.ordersCompleted?.change,
            description: "From Last Week",
        },
        {
            title: "Occupancy Rate",
            value: `${stats?.occupancy?.current || 0}%`,
            icon: BedDouble,
            change: stats?.occupancy?.change,
            description: "From Last Week",
        },
        {
            title: "Active Guests",
            value: stats?.activeGuests || 0,
            icon: Users,
            description: "Currently staying",
        },
    ];

    return (
        <div className="flex flex-col space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Reports
                    </h1>
                    <p className="text-muted-foreground">
                        Track your project and goal with full AI Assistants.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Date Range Selector */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg shadow-sm border">
                        <select
                            className="h-9 rounded-md border-0 bg-transparent px-3 text-sm focus:ring-0"
                            value={range}
                            onChange={(e) => setRange(e.target.value)}
                        >
                            <option value="this_week">This Week</option>
                            <option value="this_month">This Month</option>
                            <option value="last_30_days">Last 30 Days</option>
                            <option value="custom">Custom</option>
                        </select>
                        {range === "custom" && (
                            <>
                                <input
                                    type="date"
                                    className="h-9 rounded-md border-0 bg-transparent px-3 text-sm focus:ring-0"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                />
                                <span className="text-muted-foreground">
                                    to
                                </span>
                                <input
                                    type="date"
                                    className="h-9 rounded-md border-0 bg-transparent px-3 text-sm focus:ring-0"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </>
                        )}
                        <Button size="sm" onClick={onApply}>
                            Apply
                        </Button>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button size="sm" onClick={onExport}>
                            <Download className="h-4 w-4 mr-1" /> Export
                        </Button>
                    </div>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((kpi, index) => (
                    <Card key={index} className="pt-0 px-0 gap-2 pb-2 bg-slate-50">
                        <Card className="p-2 gap-1 border-t-0 border-x-0">
                            <CardHeader className="flex flex-row items-center justify-between p-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {kpi.title}
                                </CardTitle>
                                <div className="rounded-full p-1 border-2">
                                    <kpi.icon className="h-4 w-4 text-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent className="px-2">
                                <div className="text-2xl font-bold">
                                    {kpi.value}
                                </div>
                            </CardContent>
                        </Card>
                        <CardFooter className="flex flex-1 px-4 justify-between text-xs text-muted-foreground">
                            {kpi.change !== undefined && (
                                <div className="flex flex-1 justify-between items-center">
                                    {kpi.description} {changePill(kpi.change)}
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* LEFT COLUMN: Charts and Tables */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Revenue Timeline Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Timeline</CardTitle>
                            <CardDescription>
                                {shortDate(period?.start)} —{" "}
                                {shortDate(period?.end)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={revenueChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis
                                        tickFormatter={(v) =>
                                            `${Math.round(v / 1_000_000)}M`
                                        }
                                    />
                                    <Tooltip
                                        formatter={(v) => formatPrice(v)}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#7C4DFF"
                                        fill="#7C4DFF"
                                        fillOpacity={0.2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Booking Performance Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Booking Performance</CardTitle>
                            <CardDescription>
                                Latest bookings with estimated totals
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Guest</TableHead>
                                        <TableHead>Room</TableHead>
                                        <TableHead>Check-in</TableHead>
                                        <TableHead>Check-out</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                            Est. Total
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bookingDetails?.length ? (
                                        bookingDetails.map((b) => (
                                            <TableRow key={b.id}>
                                                <TableCell className="font-medium">
                                                    {b.guest}
                                                </TableCell>
                                                <TableCell>{b.room}</TableCell>
                                                <TableCell>
                                                    {shortDate(b.checkin)}
                                                </TableCell>
                                                <TableCell>
                                                    {shortDate(b.checkout)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            b.status ===
                                                            "checked_in"
                                                                ? "outline"
                                                                : b.status ===
                                                                  "checked_out"
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                        className="capitalize"
                                                    >
                                                        {String(
                                                            b.status || ""
                                                        ).replaceAll("_", " ")}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatPrice(b.total)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="text-center text-muted-foreground"
                                            >
                                                No bookings in this period.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Activity and Lists */}
                <div className="space-y-6">
                    {/* Top Guests */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Guests</CardTitle>
                            <CardDescription>By total spend</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {topGuests?.length ? (
                                topGuests.map((g, i) => (
                                    <div
                                        key={g.id}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-xs font-medium">
                                                {i + 1}
                                            </div>
                                            <span className="text-sm font-medium">
                                                {g.name}
                                            </span>
                                        </div>
                                        <div className="text-sm font-bold">
                                            {formatPrice(g.total)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    No guest spend in this period.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

Reports.layout = (page) => <AuthenticatedLayout>{page}</AuthenticatedLayout>;
