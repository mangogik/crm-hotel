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

// Konfigurasi label diubah
const chartConfig = {
    checkIns: {
        label: "Customers",
        color: "hsl(27, 96%, 60%)",
    },
    servicesOrdered: {
        label: "Order",
        color: "hsl(217, 94%, 67%)",
    },
};

export default function ChartCard({ data }) {
    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Aktivitas Pelanggan</CardTitle>
                <CardDescription>Data 7 Hari Terakhir</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={data}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
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
                <div className="text-muted-foreground leading-none">
                    Menampilkan total check-in dan layanan yang dipesan selama 7
                    hari terakhir
                </div>
            </CardFooter>
        </Card>
    );
}