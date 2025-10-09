import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";

const ServiceForm = ({ data, setData, errors, addOption, removeOption, updateOption }) => {
    return (
        <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name *</Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData("name", e.target.value)}
                    className="col-span-3"
                />
                {errors.name && <p className="text-red-500 text-sm col-span-4 text-right">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Input
                    id="description"
                    value={data.description}
                    onChange={(e) => setData("description", e.target.value)}
                    className="col-span-3"
                />
                {errors.description && <p className="text-red-500 text-sm col-span-4 text-right">{errors.description}</p>}
            </div>

            {/* Type */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Type *</Label>
                <Select value={data.type} onValueChange={(value) => setData("type", value)}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                        <SelectItem value="per_unit">Per Unit</SelectItem>
                        <SelectItem value="selectable">Selectable Options</SelectItem>
                    </SelectContent>
                </Select>
                {errors.type && <p className="text-red-500 text-sm col-span-4 text-right">{errors.type}</p>}
            </div>

            {/* Fulfillment Type */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fulfillment_type" className="text-right">Fulfillment *</Label>
                <Select value={data.fulfillment_type} onValueChange={(value) => setData("fulfillment_type", value)}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select fulfillment" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="staff_assisted">Staff Assisted</SelectItem>
                    </SelectContent>
                </Select>
                {errors.fulfillment_type && <p className="text-red-500 text-sm col-span-4 text-right">{errors.fulfillment_type}</p>}
            </div>

            {/* Offering Session - New Field */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="offering_session" className="text-right">Session *</Label>
                <Select value={data.offering_session} onValueChange={(value) => setData("offering_session", value)}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select offering session" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pre_checkin">Pre Check-in</SelectItem>
                        <SelectItem value="post_checkin">Post Check-in</SelectItem>
                        <SelectItem value="pre_checkout">Pre Checkout</SelectItem>
                    </SelectContent>
                </Select>
                {errors.offering_session && <p className="text-red-500 text-sm col-span-4 text-right">{errors.offering_session}</p>}
            </div>

            {/* Conditional Fields based on Type */}
            {data.type === "fixed" && (
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">Price *</Label>
                    <Input id="price" type="number" min="0" step="0.01" value={data.price} onChange={(e) => setData("price", e.target.value)} className="col-span-3" />
                    {errors.price && <p className="text-red-500 text-sm col-span-4 text-right">{errors.price}</p>}
                </div>
            )}
            {data.type === "per_unit" && (
                <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unit_name" className="text-right">Unit Name *</Label>
                        <Input id="unit_name" value={data.unit_name} onChange={(e) => setData("unit_name", e.target.value)} className="col-span-3" />
                        {errors.unit_name && <p className="text-red-500 text-sm col-span-4 text-right">{errors.unit_name}</p>}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">Price per Unit *</Label>
                        <Input id="price" type="number" min="0" step="0.01" value={data.price} onChange={(e) => setData("price", e.target.value)} className="col-span-3" />
                        {errors.price && <p className="text-red-500 text-sm col-span-4 text-right">{errors.price}</p>}
                    </div>
                </>
            )}
            {data.type === "selectable" && (
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Options *</Label>
                    <div className="col-span-3 space-y-2">
                        {data.options.map((option, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2">
                                <Input placeholder="Option name" value={option.name} onChange={(e) => updateOption(index, "name", e.target.value)} className="col-span-5" />
                                <Input type="number" placeholder="Price" min="0" step="0.01" value={option.price} onChange={(e) => updateOption(index, "price", e.target.value)} className="col-span-5" />
                                <Button type="button" variant="outline" size="sm" onClick={() => removeOption(index)} disabled={data.options.length <= 1} className="col-span-2">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-2">
                            <Plus className="h-4 w-4 mr-1" /> Add Option
                        </Button>
                        {errors.options && <p className="text-red-500 text-sm mt-1">{errors.options}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceForm;