import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CustomerForm = ({ data, setData, errors }) => {
    const fields = [
        { id: "name", label: "Name *", type: "text" },
        { id: "email", label: "Email", type: "email" },
        { id: "phone", label: "Phone", type: "text" },
        { id: "passport_country", label: "Country", type: "text" },
        { id: "notes", label: "Notes", type: "text" },
    ];

    return (
        <div className="grid gap-4 py-4">
            {fields.map(field => (
                <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={field.id} className="text-right">{field.label}</Label>
                    <Input
                        id={field.id}
                        type={field.type}
                        value={data[field.id] || ""}
                        onChange={(e) => setData(field.id, e.target.value)}
                        className="col-span-3"
                    />
                    {errors[field.id] && (
                        <p className="text-red-500 text-sm col-span-4 text-right">
                            {errors[field.id]}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default CustomerForm;