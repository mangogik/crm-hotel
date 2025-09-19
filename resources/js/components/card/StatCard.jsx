import React from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
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

    const color = isPositive ? "emerald" : "red";
    const changeValue = change ? change.replace(/[+\-%]/g, "") : "0";
    const progress = Math.min(parseInt(changeValue) || 0, 100);

    const colorMap = {
        blue: {
            bg: "bg-blue-100",
            text: "text-blue-600",
        },
        green: {
            bg: "bg-green-100",
            text: "text-green-600",
        },
        purple: {
            bg: "bg-purple-100",
            text: "text-purple-600",
        },
        red: {
            bg: "bg-red-100",
            text: "text-red-600",
        },
    };
    const colors = colorMap[iconColor] || colorMap.blue;

    return (
        <Card className="overflow-hidden hover:shadow-md gap-2">
            <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {IconComponent && (
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                            <IconComponent
                                className={`w-4 h-4 ${colors.text}`}
                            />
                        </div>
                    )}
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {title}
                    </CardTitle>
                </div>
                {change && (
                    <Badge
                        variant="outline"
                        className={`flex items-center gap-1 border-${color}-200 bg-${color}-50 text-${color}-700`}
                    >
                        <TrendIcon className="h-3.5 w-3.5" />
                        {change}
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="">
                <div className="text-3xl font-bold">{metric}</div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pb-3 pt-1">
                    {comparisonText && (
                        <div className="flex items-center gap-1">
                            <ArrowIcon
                                className={`h-3.5 w-3.5 text-${color}-600`}
                            />
                            {comparisonText}
                        </div>
                    )}
                    {target && <span>Target: {target}</span>}
                </div>

                {description && (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
