import { Button } from "@/components/ui/button";
import {
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";

const CustomerHeader = ({ onAddCustomer }) => {
    return (
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-2xl font-bold">Customers</CardTitle>
                    <CardDescription>Manage your customer database</CardDescription>
                </div>
                <Button onClick={onAddCustomer} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add Customer
                </Button>
            </div>
        </CardHeader>
    );
};

export default CustomerHeader;
