// resources/js/components/orders/OrderForm.jsx
import { useEffect, useState } from "react";

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

const formatPrice = (price) => {
  if (!price && price !== 0) return "N/A";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(price);
};

// Safely normalize `options` field (can be stringified JSON or array or null)
function getOptionsArray(svc) {
  const raw = svc?.options;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Label promo yang ringkas
function buildPromoLabel(p, servicesDict) {
  const parts = [];
  if (p.discount_percent) parts.push(`${p.discount_percent}% off`);
  if (p.discount_amount) parts.push(`${formatPrice(Number(p.discount_amount))} off`);
  if (p.free_service_id) {
    const name = servicesDict?.[p.free_service_id]?.name || `Service #${p.free_service_id}`;
    const qty = p.free_service_qty || 1;
    parts.push(`Free: ${name} × ${qty}`);
  }
  const action = parts.length ? parts.join(" • ") : "Special offer";
  return `${p.name} (${p.type}) — ${action}`;
}

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
  isPending = true,
  isStatusUpdateOnly = false,

  // CREATE mode (opsional)
  eligiblePromos = [],
  checkingPromo = false,
}) => {
  const showCreateFields = !isStatusUpdateOnly;

  const servicesDict = (services || []).reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {});

  // === NEW: Booking select (per customer) ===
  const [customerBookings, setCustomerBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState("");

  // Reset booking_id & fetch bookings ketika customer berubah
  useEffect(() => {
    if (!showCreateFields) return;

    const customerId = data.customer_id;
    // Reset pilihan booking setiap ganti customer
    if (data.booking_id) setData("booking_id", "");

    if (!customerId) {
      setCustomerBookings([]);
      setBookingsError("");
      return;
    }

    let aborted = false;
    (async () => {
      try {
        setLoadingBookings(true);
        setBookingsError("");

        // NOTE: sediakan endpoint ini di BE (lihat catatan di bawah)
        const res = await fetch(`/api/customers/${customerId}/bookings?onlyActive=1`, {
          credentials: "same-origin",
          headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (aborted) return;

        // Expektasi response: { bookings: [{id, room_label, status, checkin_at, checkout_at}] }
        setCustomerBookings(Array.isArray(json.bookings) ? json.bookings : []);
      } catch (e) {
        if (!aborted) {
          setBookingsError("Failed to load bookings for this customer.");
          setCustomerBookings([]);
        }
      } finally {
        if (!aborted) setLoadingBookings(false);
      }
    })();

    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreateFields, data.customer_id]);

  return (
    <div className="grid gap-4 py-4">
      {showCreateFields && (
        <>
          {/* Customer */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer_id" className="text-right">
              Customer *
            </Label>
            <Select
              value={data.customer_id}
              onValueChange={(value) => setData("customer_id", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
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

          {/* Booking (optional tapi direkomendasikan) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="booking_id" className="text-right">
              Booking
            </Label>
            <div className="col-span-3 space-y-1">
              <Select
                value={data.booking_id || ""}
                onValueChange={(v) => setData("booking_id", v)}
                disabled={!data.customer_id || loadingBookings || customerBookings.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !data.customer_id
                        ? "Select customer first"
                        : loadingBookings
                        ? "Loading bookings…"
                        : customerBookings.length
                        ? "Select booking (optional)"
                        : "No active bookings"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {customerBookings.map((b) => {
                    const label = b.room_label
                      ? `${b.room_label} • ${b.status} • ${new Date(b.checkin_at).toLocaleDateString()} - ${new Date(b.checkout_at).toLocaleDateString()}`
                      : `Booking #${b.id} • ${b.status}`;
                    return (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {bookingsError && <p className="text-xs text-red-500">{bookingsError}</p>}
              {!bookingsError && data.customer_id && customerBookings.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  This customer has no active bookings. You may leave it blank.
                </p>
              )}
              {!data.customer_id && (
                <p className="text-xs text-muted-foreground">Pick a customer to choose a booking.</p>
              )}
            </div>
          </div>

          {/* Services */}
          <fieldset disabled={!isPending}>
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Services *</Label>
                <div className="col-span-3 space-y-2">
                  {orderServices.map((service, index) => {
                    const selectedService = services.find(
                      (s) => s.id === parseInt(service.id)
                    );
                    const options = getOptionsArray(selectedService);
                    const isSelectable = selectedService?.type === "selectable";
                    const isPerUnit = selectedService?.type === "per_unit";
                    const unitName = selectedService?.unit_name || "";

                    const needPackage = isSelectable && !service?.details?.package;
                    const needWeight =
                      isPerUnit &&
                      (service?.details?.weight === undefined ||
                        service?.details?.weight === null ||
                        service?.details?.weight === "" ||
                        Number.isNaN(Number(service?.details?.weight)));

                    return (
                      <div key={index} className="border rounded p-3 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Service #{index + 1}</h4>
                          {orderServices.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeService(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-7">
                            <Select
                              value={service.id}
                              onValueChange={(value) => updateService(index, "id", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select service" />
                              </SelectTrigger>
                              <SelectContent>
                                {services.map((s) => (
                                  <SelectItem key={s.id} value={s.id.toString()}>
                                    {s.name}
                                  </SelectItem>
                                ))}
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
                                  parseInt(e.target.value) || 1
                                )
                              }
                            />
                          </div>
                        </div>

                        {/* Conditional inputs by service type */}
                        {selectedService && (
                          <>
                            {isSelectable && (
                              <div className="space-y-1">
                                <Select
                                  value={service?.details?.package || ""}
                                  onValueChange={(value) =>
                                    updateServiceDetail(index, "package", value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select option" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {options.map((opt, i) => (
                                      <SelectItem key={i} value={opt.name}>
                                        {opt.name} — {formatPrice(Number(opt.price))}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {needPackage ? (
                                  <p className="text-xs text-red-500">
                                    Option is required for this service.
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    Choose package/variant.
                                  </p>
                                )}
                              </div>
                            )}

                            {isPerUnit && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder={unitName ? `Amount (${unitName})` : "Amount"}
                                    value={service?.details?.weight ?? ""}
                                    onChange={(e) =>
                                      updateServiceDetail(
                                        index,
                                        "weight",
                                        e.target.value === ""
                                          ? ""
                                          : parseFloat(e.target.value) || 0
                                      )
                                    }
                                  />
                                  {unitName && (
                                    <span className="text-sm text-muted-foreground">
                                      {unitName}
                                    </span>
                                  )}
                                </div>
                                {needWeight ? (
                                  <p className="text-xs text-red-500">
                                    {unitName ? `${unitName} is required.` : "Amount is required."}
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    Enter the {unitName || "amount"} for this service.
                                  </p>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addService}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Service
                  </Button>

                  {errors.services && (
                    <p className="text-red-500 text-sm mt-1">{errors.services}</p>
                  )}
                </div>
              </div>
            </div>
          </fieldset>

          {/* PROMOTION (tanpa event_code) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Promotion</Label>
            <div className="col-span-3 space-y-2">
              <Select
                value={data.promotion_id || ""}
                onValueChange={(v) => setData("promotion_id", v)}
                disabled={checkingPromo || eligiblePromos.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      checkingPromo
                        ? "Checking promotions…"
                        : eligiblePromos.length
                        ? "Select a promotion"
                        : "No promotion available"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {eligiblePromos.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {buildPromoLabel(p, servicesDict)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.promotion_id && (
                <p className="text-red-500 text-sm">{errors.promotion_id}</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Status */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right">
          Status *
        </Label>
        <Select value={data.status} onValueChange={(value) => setData("status", value)}>
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
          <p className="text-red-500 text-sm col-span-4 text-right">{errors.status}</p>
        )}
      </div>

      {/* Payment */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="payment_preference" className="text-right">
          Payment Method *
        </Label>
        <Select
          value={data.payment_preference}
          onValueChange={(value) => setData("payment_preference", value)}
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
        {errors.payment_preference && (
          <p className="text-red-500 text-sm col-span-4 text-right">
            {errors.payment_preference}
          </p>
        )}
      </div>
    </div>
  );
};

export default OrderForm;
