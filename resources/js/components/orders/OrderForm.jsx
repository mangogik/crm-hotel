import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { Plus, X } from "lucide-react";

// A utility function for formatting price, can be moved to a helpers file if used elsewhere
const formatPrice = (price) => {
    if (!price && price !== 0) return "N/A";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
    }).format(price);
};

const OrderForm = ({
    data,
    setData,
    errors,
    customers,
    services,
    orderServices,
    updateService,
    updateServiceDetail,
    addService,
    removeService,
    isPending = true, // Default to true for create form
    isStatusUpdateOnly = false, // Prop baru untuk mengontrol field form
}) => {
    return (
        <div className="grid gap-4 py-4">
            {!isStatusUpdateOnly && (
                <>
                    {/* Customer Selection */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="customer_id" className="text-right">
                            Customer *
                        </Label>
                        <Select
                            value={data.customer_id}
                            onValueChange={(value) =>
                                setData("customer_id", value)
                            }
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((customer) => (
                                    <SelectItem
                                        key={customer.id}
                                        value={customer.id.toString()}
                                    >
                                        {customer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.customer_id && (
                            <p className="text-red-500 text-sm col-span-4 text-right">
                                {errors.customer_id}
                            </p>
                        )}
                    </div>

                    {/* Services Section */}
                    <fieldset disabled={!isPending}>
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">
                                    Services *
                                </Label>
                                <div className="col-span-3 space-y-2">
                                    {orderServices.map((service, index) => (
                                        <div
                                            key={index}
                                            className="border rounded p-3 space-y-3"
                                        >
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-medium">
                                                    Service #{index + 1}
                                                </h4>
                                                {orderServices.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            removeService(index)
                                                        }
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-12 gap-2">
                                                <div className="col-span-7">
                                                    <Select
                                                        value={service.id}
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            updateService(
                                                                index,
                                                                "id",
                                                                value
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select service" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {services.map(
                                                                (s) => (
                                                                    <SelectItem
                                                                        key={
                                                                            s.id
                                                                        }
                                                                        value={s.id.toString()}
                                                                    >
                                                                        {s.name}
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="col-span-5">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder="Quantity"
                                                        value={service.quantity}
                                                        onChange={(e) =>
                                                            updateService(
                                                                index,
                                                                "quantity",
                                                                parseInt(
                                                                    e.target
                                                                        .value
                                                                ) || 1
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            {/* Conditional inputs based on service type */}
                                            {service.id &&
                                                (() => {
                                                    const selectedService =
                                                        services.find(
                                                            (s) =>
                                                                s.id ===
                                                                parseInt(
                                                                    service.id
                                                                )
                                                        );
                                                    if (!selectedService)
                                                        return null;
                                                    if (
                                                        selectedService.type ===
                                                        "selectable"
                                                    ) {
                                                        return (
                                                            <Select
                                                                value={
                                                                    service
                                                                        .details
                                                                        .package ||
                                                                    ""
                                                                }
                                                                onValueChange={(
                                                                    value
                                                                ) =>
                                                                    updateServiceDetail(
                                                                        index,
                                                                        "package",
                                                                        value
                                                                    )
                                                                }
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select option" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {selectedService.options?.map(
                                                                        (
                                                                            option,
                                                                            optIndex
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    optIndex
                                                                                }
                                                                                value={
                                                                                    option.name
                                                                                }
                                                                            >
                                                                                {
                                                                                    option.name
                                                                                }{" "}
                                                                                -{" "}
                                                                                {formatPrice(
                                                                                    option.price
                                                                                )}
                                                                            </SelectItem>
                                                                        )
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        );
                                                    }
                                                    if (
                                                        selectedService.type ===
                                                        "per_unit"
                                                    ) {
                                                        return (
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                placeholder="Weight/Unit"
                                                                value={
                                                                    service
                                                                        .details
                                                                        .weight ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    updateServiceDetail(
                                                                        index,
                                                                        "weight",
                                                                        parseFloat(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        ) || 0
                                                                    )
                                                                }
                                                            />
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addService}
                                        className="mt-2"
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Add
                                        Service
                                    </Button>
                                    {errors.services && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.services}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </fieldset>
                </>
            )}

            {/* Status Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                    Status *
                </Label>
                <Select
                    value={data.status}
                    onValueChange={(value) => setData("status", value)}
                >
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                {errors.status && (
                    <p className="text-red-500 text-sm col-span-4 text-right">
                        {errors.status}
                    </p>
                )}
            </div>

            {/* Payment Method Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment_method" className="text-right">
                    Payment Method *
                </Label>
                <Select
                    value={data.payment_method}
                    onValueChange={(value) => setData("payment_method", value)}
                    disabled={!isPending}
                >
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                </Select>
                {errors.payment_method && (
                    <p className="text-red-500 text-sm col-span-4 text-right">
                        {errors.payment_method}
                    </p>
                )}
            </div>
        </div>
    );
};

export default OrderForm;
