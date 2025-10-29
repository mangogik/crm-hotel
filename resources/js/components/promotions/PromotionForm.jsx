import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Percent } from "lucide-react";

/* ====== Checklist kecil ====== */
const ServiceCheckList = ({ services, selected, onToggle }) => (
  <div className="max-h-44 overflow-y-auto border rounded-md p-2 space-y-1 bg-background">
    {services.length ? (
      services.map((s) => (
        <label
          key={s.id}
          className="flex items-center gap-2 cursor-pointer px-1 py-1 rounded hover:bg-muted"
        >
          <input
            type="checkbox"
            checked={selected.includes(s.id)}
            onChange={() => onToggle(s.id)}
            className="form-checkbox h-4 w-4 text-primary rounded"
          />
          <span className="text-sm">{s.name}</span>
        </label>
      ))
    ) : (
      <div className="text-sm text-center text-muted-foreground p-3">
        No services available.
      </div>
    )}
  </div>
);

/* ====== Form ====== */
const PromotionForm = ({ form, services, toggleServiceId }) => {
  const { data, setData } = form;
  const [actionType, setActionType] = useState("percent");

  // Set default actionType & active
  useEffect(() => {
    if (data.free_service_id) setActionType("free_service");
    else if (data.discount_amount) setActionType("amount");
    else setActionType("percent");

    // default active = true bila kosong/undefined
    if (typeof data.active === "undefined" || data.active === null) {
      setData("active", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeAction = (type) => {
    setActionType(type);
    if (type === "percent") {
      setData((prev) => ({
        ...prev,
        discount_percent: prev.discount_percent || "",
        discount_amount: "",
        free_service_id: null,
      }));
    } else if (type === "amount") {
      setData((prev) => ({
        ...prev,
        discount_percent: "",
        discount_amount: prev.discount_amount || "",
        free_service_id: null,
      }));
    } else {
      // free_service
      setData((prev) => ({
        ...prev,
        discount_percent: "",
        discount_amount: "",
        free_service_id: prev.free_service_id ?? null,
      }));
    }
  };

  const onToggleService = (id) => toggleServiceId(form, id);

  const membershipValue =
    data.type === "membership" ? (data.membership_tier || "silver") : (data.membership_tier || "");

  return (
    <div className="grid gap-4 py-3">
      {/* Row: Name (full) */}
      <div className="grid gap-1">
        <Label>Name *</Label>
        <Input
          value={data.name}
          onChange={(e) => setData("name", e.target.value)}
          placeholder="e.g. Birthday H-3 10% Off"
        />
      </div>

      {/* Row: Type + Active */}
      <div className="grid grid-cols-1 md:grid-cols-2 items-end gap-3">
        <div className="grid gap-1">
          <Label>Type *</Label>
          <Select value={data.type} onValueChange={(v) => setData("type", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="birthday">Birthday</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="membership">Membership</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1">
          <Label>Active *</Label>
          <Select
            value={String(data.active ? "1" : "0")}
            onValueChange={(v) => setData("active", v === "1")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Active</SelectItem>
              <SelectItem value="0">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Params by Type */}
      {data.type === "birthday" && (
        <div className="grid gap-1">
          <Label>Days Before</Label>
          <Input
            type="number"
            min="0"
            value={data.birthday_days_before ?? 3}
            onChange={(e) =>
              setData(
                "birthday_days_before",
                Math.max(0, parseInt(e.target.value || "0", 10))
              )
            }
            placeholder="Contoh: 3"
          />
        </div>
      )}

      {data.type === "membership" && (
        <div className="grid gap-1">
          <Label>Membership Tier</Label>
          <Select
            value={membershipValue || "silver"}
            onValueChange={(v) => setData("membership_tier", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="platinum">Platinum</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Row: Action + Field */}
      <div className="grid grid-cols-1 md:grid-cols-2 items-end gap-3">
        <div className="grid gap-1">
          <Label>Action *</Label>
          <Select value={actionType} onValueChange={changeAction}>
            <SelectTrigger>
              <SelectValue placeholder="Choose action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Percent Discount</SelectItem>
              <SelectItem value="amount">Nominal Discount</SelectItem>
              <SelectItem value="free_service">Free Service</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {actionType === "percent" && (
          <div className="grid gap-1">
            <Label className="sr-only">Percent</Label>
            <div className="relative">
              <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min="1"
                max="100"
                className="pl-8"
                value={data.discount_percent || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    discount_percent: e.target.value,
                    discount_amount: "",
                    free_service_id: null,
                  })
                }
                placeholder="Discount % (e.g. 10)"
              />
            </div>
          </div>
        )}

        {actionType === "amount" && (
          <div className="grid gap-1">
            <Label className="sr-only">Amount</Label>
            <div className="relative">
              <span className="absolute left-2.5 top-2.5 text-sm text-muted-foreground">
                IDR
              </span>
              <Input
                type="number"
                min="0"
                className="pl-10"
                value={data.discount_amount || ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    discount_percent: "",
                    discount_amount: e.target.value,
                    free_service_id: null,
                  })
                }
                placeholder="Discount amount (e.g. 50000)"
              />
            </div>
          </div>
        )}

        {actionType === "free_service" && (
          <div className="grid gap-1">
            <Label className="sr-only">Free Service</Label>
            <Select
              value={data.free_service_id ? String(data.free_service_id) : "none"}
              onValueChange={(v) =>
                setData({
                  ...data,
                  free_service_id: v === "none" ? null : v,
                  discount_percent: "",
                  discount_amount: "",
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose free service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Eligible / Qualifying Services */}
      <div className="grid gap-1">
        <Label>
          {actionType === "free_service"
            ? "Qualifying Services (Optional)"
            : "Eligible Services (Optional)"}
        </Label>
        <ServiceCheckList
          services={services}
          selected={data.service_ids || []}
          onToggle={(id) => toggleServiceId(form, id)}
        />
        <p className="text-xs text-muted-foreground">
          {actionType === "free_service"
            ? "Kosongkan bila hadiah gratis berlaku untuk pembelian layanan apa pun."
            : "Kosongkan untuk berlaku ke semua layanan."}
        </p>
      </div>
    </div>
  );
};

export default PromotionForm;
