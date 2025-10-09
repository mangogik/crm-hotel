import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DollarSign,
    Calendar,
    XCircle,
    RefreshCw,
} from "lucide-react";

// Helper untuk format mata uang
const formatPrice = (v) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(v || 0);

const PaymentHeader = ({ totals }) => {
    // Data untuk kartu statistik
    const stats = [
        {
            title: "Paid Amount",
            value: formatPrice(totals?.paid),
            icon: DollarSign,
            color: "text-green-600",
            bgColor: "bg-green-100",
            borderColor: "border-green-200",
        },
        {
            title: "Pending Amount",
            value: formatPrice(totals?.pending),
            icon: Calendar,
            color: "text-amber-600",
            bgColor: "bg-amber-100",
            borderColor: "border-amber-200",
        },
        {
            title: "Failed Amount",
            value: formatPrice(totals?.failed),
            icon: XCircle,
            color: "text-red-600",
            bgColor: "bg-red-100",
            borderColor: "border-red-200",
        },
        {
            title: "Refunded Amount",
            value: formatPrice(totals?.refunded),
            icon: RefreshCw,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
            borderColor: "border-purple-200",
        },
    ];

    return (
        <div className="pb-4">
            {/* Bagian Judul Halaman */}
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-2xl font-bold">Payments</CardTitle>
                    <CardDescription>
                        Monitor and reconcile all transactions
                    </CardDescription>
                </div>
            </div>

            {/* Bagian Kartu Statistik (Digabung di sini) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-6">
                {stats.map((kpi, index) => (
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
                            <div className="text-2xl font-bold">{kpi.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default PaymentHeader;

