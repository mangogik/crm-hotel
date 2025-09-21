import React from "react";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

// 1. Data diubah menjadi harian
const chartData = [
    { date: "2025-09-11", checkIns: 35, servicesOrdered: 28 },
    { date: "2025-09-12", checkIns: 42, servicesOrdered: 35 },
    { date: "2025-09-13", checkIns: 55, servicesOrdered: 48 },
    { date: "2025-09-14", checkIns: 50, servicesOrdered: 41 },
    { date: "2025-09-15", checkIns: 38, servicesOrdered: 30 },
    { date: "2025-09-16", checkIns: 45, servicesOrdered: 39 },
    { date: "2025-09-17", checkIns: 48, servicesOrdered: 42 },
];

// 2. Konfigurasi label diubah
const chartConfig = {
    checkIns: {
        label: "Customers",
        color: "hsl(27, 96%, 60%)", // <-- Tambahkan ini
    },
    servicesOrdered: {
        label: "Order",
        color: "hsl(217, 94%, 67%)", // <-- Tambahkan ini
    },
};

export default function ChartCard() {
    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Aktivitas Pelanggan</CardTitle>
                <CardDescription>Data 7 Hari Terakhir</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date" // 3. dataKey diubah ke "date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            // 4. Formatter diubah untuk menampilkan tanggal
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString("id-ID", {
                                    month: "short",
                                    day: "numeric",
                                });
                            }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dashed" />}
                        />

                        <Bar
                            dataKey="checkIns"
                            fill={chartConfig.checkIns.color}
                            radius={4}
                        />
                        <Bar
                            dataKey="servicesOrdered"
                            fill={chartConfig.servicesOrdered.color}
                            radius={4}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    Trending naik 5.2% bulan ini{" "}
                    <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Menampilkan total check-in dan layanan yang dipesan selama 7
                    hari terakhir
                </div>
            </CardFooter>
        </Card>
    );
}
