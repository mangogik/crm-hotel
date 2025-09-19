import StatCard from "@/components/card/StatCard";
import ChartCard from "@/components/card/ChartCard";
import RankTableCard from "@/components/card/RankTableCard";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Home({}) {
    const { props } = usePage();
    console.log(props.auth.user);
    return (
        <div className="">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 ">
                <StatCard
                    title="Revenue (Today)"
                    metric="Rp. 9.500.000"
                    change="+12.5%"
                    changeType="positive"
                    comparisonText="vs. Rp. 8.000.000 yesterday"
                    description="Strong performance driven by new product sales."
                    icon="dollar"
                    iconColor="blues"
                />
                <StatCard
                    title="Customers (Today)"
                    metric="87"
                    change="+18%"
                    changeType="positive"
                    comparisonText="vs. 74 yesterday"
                    description="Increase driven by referral campaigns."
                    icon="users"
                    iconColor="green"
                />

                <StatCard
                    title="Orders (Today)"
                    metric="81"
                    change="-0.49%"
                    changeType="negative"
                    comparisonText="vs. 85 yesterday"
                    description="Slight dip in afternoon orders compared to usual trend."
                    icon="cart"
                    iconColor="purple"
                />
            </section>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-[3fr_2fr]">
                <RankTableCard />
                <ChartCard />
            </section>
        </div>
    );
}

Home.layout = (page) => <AuthenticatedLayout children={page} />;
