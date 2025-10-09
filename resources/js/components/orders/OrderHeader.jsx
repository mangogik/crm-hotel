import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Plus, DollarSign, Clock, CalendarDays, Activity } from "lucide-react";

const formatPrice = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(v || 0);

const OrderHeader = ({ onAddOrder, totals = {} }) => {
  // Safe defaults
  const totalOrders      = totals?.total_orders ?? 0;
  const todayOrders      = totals?.today_orders ?? 0;
  const paidAmount       = totals?.paid_amount ?? 0;
  const pendingAmount    = totals?.pending_amount ?? 0;
  const avgOrderValueRaw = totals?.avg_order_value ?? 0;

  // Cards config (same vibe as PaymentHeader)
  const stats = [
    {
      title: "Paid Amount",
      value: formatPrice(paidAmount),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
    },
    {
      title: "Pending Amount",
      value: formatPrice(pendingAmount),
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      borderColor: "border-amber-200",
    },
    {
      title: "Orders Today",
      value: todayOrders?.toLocaleString?.("id-ID") ?? todayOrders,
      icon: CalendarDays,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-200",
    },
    {
      title: "Avg Order Value",
      value: formatPrice(avgOrderValueRaw),
      icon: Activity,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      borderColor: "border-indigo-200",
    },
  ];

  return (
    <div className="pb-4">
      {/* Top row: Title + Add Order */}
      <div className="flex justify-between items-center">
        <div>
          <CardTitle className="text-2xl font-bold">Orders</CardTitle>
          <CardDescription>Manage customer orders</CardDescription>
        </div>
        <Button onClick={onAddOrder} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Order
        </Button>
      </div>

      {/* KPI cards (same layout language as PaymentHeader) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-6 w-full">
        {stats.map((kpi, idx) => (
          <Card key={idx} className={`p-2 gap-1 border-b-8 ${kpi.borderColor}`}>
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </div>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                </div>
                <div className={`rounded-full p-2 border-2 ${kpi.bgColor}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrderHeader;
