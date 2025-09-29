import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Users, DollarSign, Bed } from "lucide-react";

const RoomSelectionStep = ({ rooms, onRoomSelected, onNextStep }) => {
    const formatPrice = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleSelectRoom = (room) => {
        onRoomSelected(room);
        onNextStep();
    };

    return (
        <div className="space-y-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Room</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Price per Night</TableHead>
                        <TableHead>Total Price</TableHead>
                        <TableHead className="w-[120px]">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rooms.map((room) => (
                        <TableRow key={room.id}>
                            <TableCell className="font-medium">
                                Room {room.room_number}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">
                                    {room.room_type}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>Up to {room.capacity} guest(s)</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {formatPrice(room.price_per_night)}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="font-medium">
                                {formatPrice(room.total_price)}
                                <div className="text-xs text-muted-foreground">
                                    for {room.nights} night(s)
                                </div>
                            </TableCell>
                            <TableCell>
                                <Button
                                    size="sm"
                                    onClick={() => handleSelectRoom(room)}
                                    className="w-full"
                                >
                                    Select
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default RoomSelectionStep;
