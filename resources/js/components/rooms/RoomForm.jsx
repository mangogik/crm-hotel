import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RoomForm = ({ data, setData, errors }) => {
    const fields = [
        { id: "room_number", label: "Room Number *", type: "text" },
        { id: "room_type", label: "Room Type *", type: "text" },
        { id: "capacity", label: "Capacity *", type: "number" },
        { id: "price_per_night", label: "Price per Night *", type: "number" },
    ];

    return (
        <div className="grid gap-4 py-4">
            {fields.map(field => (
                <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={field.id} className="text-left">{field.label}</Label>
                    <Input
                        id={field.id}
                        type={field.type}
                        value={data[field.id] || ""}
                        onChange={(e) => setData(field.id, e.target.value)}
                        className="col-span-3"
                        min={field.type === 'number' ? 0 : undefined}
                    />
                    {errors[field.id] && (
                        <p className="text-red-500 text-sm col-span-4 text-right">{errors[field.id]}</p>
                    )}
                </div>
            ))}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status *</Label>
                <Select value={data.status || 'available'} onValueChange={(value) => setData('status', value)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                </Select>
                {errors.status && (
                    <p className="text-red-500 text-sm col-span-4 text-right">{errors.status}</p>
                )}
            </div>
        </div>
    );
};

export default RoomForm;
