import StatCard from "@/components/dashboard/StatCard";
import ChartCard from "@/components/dashboard/ChartCard";
import RankTableCard from "@/components/dashboard/RankTableCard";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Home({}) {
    const { props } = usePage();
    const { stats, chartData, topServices } = props;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 ">
                <StatCard
                    title="Revenue (Today)"
                    metric={formatCurrency(stats.revenue.today)}
                    change={stats.revenue.change > 0 ? `+${stats.revenue.change}%` : `${stats.revenue.change}%`}
                    changeType={stats.revenue.change >= 0 ? "positive" : "negative"}
                    comparisonText={`vs. ${formatCurrency(stats.revenue.yesterday)} yesterday`}
                    description="Strong performance driven by new product sales."
                    icon="dollar"
                    iconColor="blues"
                />
                <StatCard
                    title="Customers (Today)"
                    metric={stats.customers.today}
                    change={stats.customers.change > 0 ? `+${stats.customers.change}%` : `${stats.customers.change}%`}
                    changeType={stats.customers.change >= 0 ? "positive" : "negative"}
                    comparisonText={`vs. ${stats.customers.yesterday} yesterday`}
                    description="Increase driven by referral campaigns."
                    icon="users"
                    iconColor="green"
                />

                <StatCard
                    title="Orders (Today)"
                    metric={stats.orders.today}
                    change={stats.orders.change > 0 ? `+${stats.orders.change}%` : `${stats.orders.change}%`}
                    changeType={stats.orders.change >= 0 ? "positive" : "negative"}
                    comparisonText={`vs. ${stats.orders.yesterday} yesterday`}
                    description="Slight dip in afternoon orders compared to usual trend."
                    icon="cart"
                    iconColor="purple"
                />
            </section>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-[3fr_2fr]">
                <RankTableCard data={topServices} />
                <ChartCard data={chartData} />
            </section>
        </div>
    );
}

Home.layout = (page) => <AuthenticatedLayout children={page} />;