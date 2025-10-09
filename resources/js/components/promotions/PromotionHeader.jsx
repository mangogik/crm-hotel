import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Plus, Tag, TrendingUp, TrendingDown, Activity } from "lucide-react";

const PromotionHeader = ({ onAdd, stats }) => {
    const statsData = [
        {
            title: "Total Promotions",
            value: stats?.total || 0,
            icon: Tag,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            borderColor: "border-blue-200",
        },
        {
            title: "Active Promotions",
            value: stats?.active || 0,
            icon: TrendingUp,
            color: "text-green-600",
            bgColor: "bg-green-100",
            borderColor: "border-green-200",
        },
        {
            title: "Inactive Promotions",
            value: (stats?.total || 0) - (stats?.active || 0),
            icon: TrendingDown,
            color: "text-red-600",
            bgColor: "bg-red-100",
            borderColor: "border-red-200",
        },
        {
            title: "Total Usage",
            value: stats?.usage || 0,
            icon: Activity,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
            borderColor: "border-purple-200",
        },
    ];

    return (
        <div className="pb-4">
            {/* Header (judul + tombol) */}
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-2xl font-bold">
                        Promotions
                    </CardTitle>
                    <CardDescription>
                        Manage and monitor all promotional activities efficiently.
                    </CardDescription>
                </div>
                <Button onClick={onAdd} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> New Promotion
                </Button>
            </div>

            {/* KPI Cards (gaya sama seperti PaymentHeader) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-6">
                {statsData.map((kpi, index) => (
                    <Card
                        key={index}
                        className={`p-2 gap-1 border-b-8 ${kpi.borderColor}`}
                    >
                        <CardHeader className="flex flex-row items-center justify-between p-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {kpi.title}
                            </CardTitle>
                            <div
                                className={`rounded-full p-1 border-2 ${kpi.bgColor}`}
                            >
                                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent className="px-2">
                            <div className="text-2xl font-bold">
                                {kpi.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default PromotionHeader;
