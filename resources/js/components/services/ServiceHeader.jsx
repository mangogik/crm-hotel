import { Button } from "@/components/ui/button";
import {
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";

const ServiceHeader = ({ onAddService }) => {
    return (
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-2xl font-bold">Services</CardTitle>
                    <CardDescription>Manage your service offerings</CardDescription>
                </div>
                <Button onClick={onAddService} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add Service
                </Button>
            </div>
        </CardHeader>
    );
};

export default ServiceHeader;

