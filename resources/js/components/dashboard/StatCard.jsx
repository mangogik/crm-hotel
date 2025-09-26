import React from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    DollarSign,
    ShoppingCart,
    Calendar,
    BarChart3,
} from "lucide-react";

const iconMap = {
    users: Users,
    dollar: DollarSign,
    cart: ShoppingCart,
    chart: BarChart3,
    calendar: Calendar,
};

// 1. Buat objek pemetaan untuk semua kemungkinan kelas
const colorStyles = {
    positive: {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        arrow: "text-emerald-600",
    },
    negative: {
        badge: "border-red-200 bg-red-50 text-red-700",
        arrow: "text-red-600",
    },
};

export default function StatCard({
    title,
    metric,
    change,
    changeType = "positive",
    comparisonText,
    description,
    icon,
    target,
    previousValue,
    iconColor = "blue",
}) {
    const isPositive = changeType === "positive";
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const ArrowIcon = isPositive ? ArrowUpRight : ArrowDownRight;
    const IconComponent = icon ? iconMap[icon] : null;

    const colorMap = {
        blue: { bg: "bg-blue-100", text: "text-blue-600" },
        green: { bg: "bg-green-100", text: "text-green-600" },
        purple: { bg: "bg-purple-100", text: "text-purple-600" },
        red: { bg: "bg-red-100", text: "text-red-600" },
    };
    const colors = colorMap[iconColor] || colorMap.blue;

    return (
        <Card className="overflow-hidden hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    {IconComponent && (
                        <div className={`rounded-lg p-2 ${colors.bg}`}>
                            <IconComponent className={`h-4 w-4 ${colors.text}`} />
                        </div>
                    )}
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {title}
                    </CardTitle>
                </div>
                {change && (
                    <Badge
                        variant="outline"
                        className={`flex items-center gap-1 ${colorStyles[changeType].badge}`}
                    >
                        <TrendIcon className="h-3.5 w-3.5" />
                        {change}
                    </Badge>
                )}
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{metric}</div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {comparisonText && (
                        <div className="flex items-center gap-1">
                            <ArrowIcon
                                className={`h-3.5 w-3.5 ${colorStyles[changeType].arrow}`}
                            />
                            {comparisonText}
                        </div>
                    )}
                    {target && <span>Target: {target}</span>}
                </div>

                {description && (
                    <p className="pt-2 text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}