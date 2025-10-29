// resources/js/components/rooms/RoomTypeForm.jsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RoomTypeForm = ({ data, setData, errors }) => {
  const fields = [
    { id: "name", label: "Name *", type: "text", placeholder: "e.g., Standard, Deluxe" },
    { id: "capacity", label: "Capacity *", type: "number", min: 1, placeholder: "Guests" },
    { id: "price_per_night", label: "Price per Night *", type: "number", min: 0, step: "0.01", placeholder: "0.00" },
  ];

  return (
    <div className="grid gap-4 py-4">
      {fields.map((f) => (
        <div key={f.id} className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={f.id} className="text-right">
            {f.label}
          </Label>
          <Input
            id={f.id}
            type={f.type}
            value={data[f.id] ?? ""}
            onChange={(e) => setData(f.id, e.target.value)}
            className="col-span-3"
            placeholder={f.placeholder}
            {...(f.min !== undefined ? { min: f.min } : {})}
            {...(f.step !== undefined ? { step: f.step } : {})}
          />
          {errors?.[f.id] && (
            <p className="text-red-500 text-sm col-span-4 text-right">{errors[f.id]}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default RoomTypeForm;
