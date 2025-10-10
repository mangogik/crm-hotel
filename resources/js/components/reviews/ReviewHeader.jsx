import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Star, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";

const ReviewHeader = ({ totals }) => {
    const statsData = [
        {
            title: "Average Rating",
            value: totals?.avg_rating || 0,
            icon: Star,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
            borderColor: "border-yellow-200",
            suffix: "/5",
        },
        {
            title: "Total Reviews",
            value: totals?.total || 0,
            icon: MessageSquare,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            borderColor: "border-blue-200",
        },
        {
            title: "Forwarded to Google",
            value: totals?.good || 0,
            icon: ThumbsUp,
            color: "text-green-600",
            bgColor: "bg-green-100",
            borderColor: "border-green-200",
        },
        {
            title: "Not Forwarded",
            value: totals?.low || 0,
            icon: ThumbsDown,
            color: "text-red-600",
            bgColor: "bg-red-100",
            borderColor: "border-red-200",
        },
    ];

    return (
        <div className="pb-4">
            <div>
                <CardTitle className="text-2xl font-bold">
                    Customer Reviews
                </CardTitle>
                <CardDescription>
                    Monitor customer feedback and satisfaction metrics.
                </CardDescription>
            </div>

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
                                {kpi.suffix || ""}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ReviewHeader;
