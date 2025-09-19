import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardFooter,
    CardHeader,
    CardContent,
    CardTitle,
    CardDescription,
} from "../ui/card";

// 1. Data dummy baru untuk merangking layanan terlaris
const rankedServices = [
    {
        rank: 1,
        serviceName: "Spa & Massage",
        orderCount: 58,
        totalRevenue: "Rp. 9.800.000",
        change: "+15%", // Perubahan vs 7 hari sebelumnya
    },
    {
        rank: 2,
        serviceName: "Room Service Meal",
        orderCount: 75,
        totalRevenue: "Rp. 6.000.000",
        change: "+8%",
    },
    {
        rank: 3,
        serviceName: "Sewa Ruangan Meeting",
        orderCount: 12,
        totalRevenue: "Rp. 5.400.000",
        change: "-5%",
    },
    {
        rank: 4,
        serviceName: "Upgrade Bed",
        orderCount: 45,
        totalRevenue: "Rp. 4.100.000",
        change: "+12%",
    },
    {
        rank: 5,
        serviceName: "Laundry/Dry Cleaning",
        orderCount: 98,
        totalRevenue: "Rp. 2.500.000",
        change: "+3%",
    },
];

export default function RankTableCard() {
    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Layanan Terlaris</CardTitle>
                <CardDescription>
                    Peringkat berdasarkan pendapatan selama 7 hari terakhir
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>
                        Daftar layanan paling laris di hotel Anda.
                    </TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">
                                Peringkat
                            </TableHead>
                            <TableHead>Nama Layanan</TableHead>
                            <TableHead className="text-right">
                                Jumlah Pesanan
                            </TableHead>
                            <TableHead className="text-right">
                                Total Pendapatan
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* 3. Mapping data baru ke dalam baris tabel */}
                        {rankedServices.map((service) => (
                            <TableRow key={service.rank}>
                                <TableCell className="font-medium text-center">
                                    {service.rank}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {service.serviceName}
                                </TableCell>
                                <TableCell className="text-right">
                                    {service.orderCount}
                                </TableCell>
                                <TableCell className="text-right">
                                    {service.totalRevenue}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
