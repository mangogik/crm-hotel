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
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

export default function RankTableCard({ data }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Layanan Terlaris</CardTitle>
                <CardDescription>
                    Peringkat berdasarkan pendapatan selama 7 hari terakhir
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Peringkat</TableHead>
                            <TableHead>Nama Layanan</TableHead>
                            <TableHead className="text-right">Jumlah Pesanan</TableHead>
                            <TableHead className="text-right">Total Pendapatan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data && data.length > 0 ? (
                            data.map((service) => (
                                <TableRow key={service.rank}>
                                    <TableCell className="font-medium text-center">{service.rank}</TableCell>
                                    <TableCell className="font-medium">{service.serviceName}</TableCell>
                                    <TableCell className="text-right">{service.orderCount}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(service.totalRevenue)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Belum ada data pendapatan layanan dalam 7 hari terakhir.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
