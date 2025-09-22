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

export default function RankTableCard({ data }) {
    // Format currency function
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

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
                        {data.map((service) => (
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
                                    {console.log(data)}
                                    {formatCurrency(service.totalRevenue)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}