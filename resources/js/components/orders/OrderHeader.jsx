import { Button } from "../../components/ui/button";
import {
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";
import { Plus } from "lucide-react";

const OrderHeader = ({ onAddOrder }) => {
    return (
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-2xl font-bold">
                        Orders
                    </CardTitle>
                    <CardDescription>Manage customer orders</CardDescription>
                </div>
                <Button
                    onClick={onAddOrder}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" /> Add Order
                </Button>
            </div>
        </CardHeader>
    );
};

export default OrderHeader;

