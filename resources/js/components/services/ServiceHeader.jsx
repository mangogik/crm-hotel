import { Button } from "@/components/ui/button";
import {
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Link } from "@inertiajs/react"; // 1. Import Link

// 2. Hapus prop 'onAddService'
const ServiceHeader = () => {
    return (
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-2xl font-bold">Services</CardTitle>
                    <CardDescription>Manage your service offerings</CardDescription>
                </div>
                {/* 3. Ganti Button onClick dengan Link ke halaman create */}
                <Link href={route("services.create")}>
                    <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add Service
                    </Button>
                </Link>
            </div>
        </CardHeader>
    );
};

export default ServiceHeader;