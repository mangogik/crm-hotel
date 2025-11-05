import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ServiceCategoryForm = ({ data, setData, errors }) => {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Name *
        </Label>
        <div className="col-span-3">
          <Input
            id="name"
            type="text"
            value={data.name ?? ""}
            onChange={(e) => setData("name", e.target.value)}
            className={errors?.name ? "border-red-500" : ""}
            placeholder="e.g., Dining & Beverages"
          />
          {errors?.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="description" className="text-right mt-1">
          Description
        </Label>
        <div className="col-span-3">
          <Textarea
            id="description"
            value={data.description ?? ""}
            onChange={(e) => setData("description", e.target.value)}
            className={errors?.description ? "border-red-500" : ""}
            placeholder="Briefly describe this service category..."
            rows={3}
          />
          {errors?.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCategoryForm;