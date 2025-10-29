import { useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "../../components/ui/checkbox"; // shadcn checkbox
import { Textarea } from "../../components/ui/textarea"; // <-- NEW import for notes textarea
import { Plus, X, HelpCircle, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

const formatPrice = (price) => {
  if (!price && price !== 0) return "N/A";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(price);
};

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

function allowedSessionsForBookingStatus(statusRaw) {
  if (!statusRaw) return null;
  const status = String(statusRaw).toLowerCase();
  if (["reserved"].includes(status)) return new Set(["pre_checkin"]);
  if (["checked_in"].includes(status)) return new Set(["post_checkin", "pre_checkout"]);
  return null;
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
  eligiblePromos = [],
  checkingPromo = false,
}) => {
  const showCreateFields = !isStatusUpdateOnly;

  const servicesDict = (services || []).reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {});

  const [customerBookings, setCustomerBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState("");

  const selectedBooking = useMemo(() => {
    if (!data.booking_id) return null;
    const idNum = Number(data.booking_id);
    return customerBookings.find((b) => Number(b.id) === idNum) || null;
  }, [data.booking_id, customerBookings]);

  const allowedSessions = useMemo(
    () => allowedSessionsForBookingStatus(selectedBooking?.status),
    [selectedBooking]
  );

  const filteredServices = useMemo(() => {
    if (!Array.isArray(services) || services.length === 0) return [];
    if (!allowedSessions) return services;
    return services.filter((s) => allowedSessions.has(s.offering_session));
  }, [services, allowedSessions]);

  const [serviceQuestions, setServiceQuestions] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState({});
  const [checkedServices, setCheckedServices] = useState(new Set());

  useEffect(() => {
    if (!showCreateFields) return;

    const fetchQuestionsForService = async (serviceId, serviceIndex) => {
      if (!serviceId) return;
      setLoadingQuestions((prev) => ({ ...prev, [serviceId]: true }));
      try {
        const response = await fetch(`/api/services/${serviceId}/questions`);
        if (response.ok) {
          const questions = await response.json();
          setServiceQuestions((prev) => ({ ...prev, [serviceId]: questions }));
          const currentAnswers = orderServices[serviceIndex]?.details?.answers || [];
          if (currentAnswers.length !== questions.length) {
            const newAnswers = Array(questions.length).fill("");
            currentAnswers.forEach((answer, idx) => {
              if (idx < questions.length) newAnswers[idx] = answer;
            });
            updateServiceDetail(serviceIndex, "answers", newAnswers);
          }
        }
      } catch (e) {
        console.error("Error fetching questions:", e);
      } finally {
        setLoadingQuestions((prev) => ({ ...prev, [serviceId]: false }));
      }
    };

    const currentServiceIds = orderServices.map((s) => s.id).filter(Boolean);
    const newServices = currentServiceIds.filter((id) => !checkedServices.has(id));
    if (newServices.length > 0) {
      setCheckedServices((prev) => new Set([...prev, ...newServices]));
      orderServices.forEach((service, index) => {
        if (service.id && newServices.includes(service.id)) {
          fetchQuestionsForService(service.id, index);
        }
      });
    }
  }, [orderServices, showCreateFields, checkedServices, updateServiceDetail]);

  useEffect(() => {
    if (!showCreateFields) {
      setCheckedServices(new Set());
      setServiceQuestions({});
    }
  }, [showCreateFields]);

  useEffect(() => {
    if (!showCreateFields) return;

    const customerId = data.customer_id;
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
        const res = await fetch(`/api/customers/${customerId}/bookings?onlyActive=1`, {
          credentials: "same-origin",
          headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (aborted) return;
        setCustomerBookings(Array.isArray(json.bookings) ? json.bookings : []);
      } catch (_e) {
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

  // =========================
  // EDIT MODE — NO cards, and also no ability to edit notes here by default
  // (Your current design only edits status/payment in edit modal)
  // =========================
  if (isStatusUpdateOnly) {
    return (
      <div className="text-sm py-2">
        <div className="grid grid-cols-5 gap-3 items-center">
          <Label htmlFor="status" className="col-span-2 text-right">Status *</Label>
          <div className="col-span-3">
            <Select value={data.status} onValueChange={(v) => setData("status", v)}>
              <SelectTrigger className="h-8 py-1 px-2">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="mt-1 text-xs text-destructive">{errors.status}</p>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-5 gap-3 items-center">
          <Label htmlFor="payment_preference" className="col-span-2 text-right">
            Payment Method *
          </Label>
          <div className="col-span-3">
            <Select
              value={data.payment_preference}
              onValueChange={(v) => setData("payment_preference", v)}
            >
              <SelectTrigger className="h-8 py-1 px-2">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
            {errors.payment_preference && (
              <p className="mt-1 text-xs text-destructive">{errors.payment_preference}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // CREATE MODE — form lengkap (now includes Order Notes textarea)
  // =========================
  return (
    <div className="grid gap-4 py-3 w-full max-w-none mx-auto px-3 sm:px-4 text-sm">
      {showCreateFields && (
        <>
          {/* Two-column layout with 1:1 ratio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column - Order Information */}
            <Card>
              <CardHeader className="">
                <CardTitle>Order Information</CardTitle>
                <CardDescription>
                  Customer and order details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6 pt-0">
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
                    <p className="text-destructive text-sm col-span-4 text-right">
                      {errors.customer_id}
                    </p>
                  )}
                </div>

                {/* Booking */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="booking_id" className="text-right">
                    Booking
                  </Label>
                  <div className="col-span-3 space-y-1 min-w-0">
                    <Select
                      value={data.booking_id || ""}
                      onValueChange={(v) => setData("booking_id", v)}
                      disabled={!data.customer_id || loadingBookings || customerBookings.length === 0}
                    >
                      <SelectTrigger
                        className="min-w-0 w-full [&>span]:block [&>span]:truncate"
                        title={
                          (() => {
                            if (!data.booking_id) return undefined;
                            const b = customerBookings.find((x) => String(x.id) === String(data.booking_id));
                            if (!b) return undefined;
                            return b.room_label
                              ? `${b.room_label} • ${b.status} • ${new Date(b.checkin_at).toLocaleDateString()} - ${new Date(b.checkout_at).toLocaleDateString()}`
                              : `Booking #${b.id} • ${b.status}`;
                          })()
                        }
                      >
                        <SelectValue
                          placeholder={
                            !data.customer_id
                              ? "Select customer first"
                              : loadingBookings
                              ? "Loading bookings…"
                              : customerBookings.length
                              ? "Select booking"
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
                            <SelectItem
                              key={b.id}
                              value={String(b.id)}
                              className="whitespace-normal break-words leading-snug py-2"
                              title={label}
                            >
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {bookingsError && <p className="text-xs text-destructive">{bookingsError}</p>}
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

                {/* Promotion */}
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
                      <p className="text-destructive text-sm">{errors.promotion_id}</p>
                    )}
                  </div>
                </div>

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
                    <p className="text-destructive text-sm col-span-4 text-right">{errors.status}</p>
                  )}
                </div>

                {/* Payment */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="payment_preference" className="">
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
                    <p className="text-destructive text-sm col-span-4 text-right">
                      {errors.payment_preference}
                    </p>
                  )}
                </div>

                {/* Order Notes (general instructions / remarks for staff) */}
                <div className="grid grid-cols-4 gap-4">
                  <Label htmlFor="order_notes" className="text-right">
                    Notes
                  </Label>
                  <div className="col-span-3 space-y-1">
                    <Textarea
                      id="order_notes"
                      placeholder="Ex: Deliver after 7 PM, knock softly, guest will pay at checkout."
                      className="min-h-[70px] resize-y"
                      value={data.order_notes || ""}
                      onChange={(e) => setData("order_notes", e.target.value)}
                    />
                    {errors.order_notes && (
                      <p className="text-destructive text-sm">{errors.order_notes}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Services */}
            <Card className="">
              <CardHeader>
                <CardTitle>Services</CardTitle>
                <CardDescription>
                  Add services to this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto pr-2 max-h-[clamp(200px,45vh,380px)]">
                  <fieldset disabled={!isPending} className="space-y-4">
                    <div className="space-y-4">
                      {orderServices.map((service, index) => {
                        const selectedService = filteredServices.find(
                          (s) => String(s.id) === String(service.id)
                        );
                        const options = getOptionsArray(selectedService || servicesDict[service.id]);
                        const svcType = selectedService?.type || servicesDict[service.id]?.type;

                        const isSelectable = svcType === "selectable";
                        const isMulti = svcType === "multiple_options"; // uses shadcn Checkbox
                        const isPerUnit = svcType === "per_unit";
                        const unitName = selectedService?.unit_name || servicesDict[service.id]?.unit_name || "";

                        const needPackage = isSelectable && !service?.details?.package;
                        const needWeight =
                          isPerUnit &&
                          (service?.details?.weight === undefined ||
                            service?.details?.weight === null ||
                            service?.details?.weight === "" ||
                            Number.isNaN(Number(service?.details?.weight)));

                        const questions = serviceQuestions[service.id] || [];
                        const hasQuestions = questions.length > 0;
                        const isLoadingQuestions = loadingQuestions[service.id];

                        return (
                          <Card key={index} className="border border-border">
                            <CardContent className="p-4 space-y-4">
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
                                      {filteredServices.map((s) => (
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

                              {selectedService && (
                                <>
                                  {/* Single Select */}
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
                                        <p className="text-xs text-destructive">
                                          Option is required for this service.
                                        </p>
                                      ) : (
                                        <p className="text-xs text-muted-foreground">
                                          Choose package/variant.
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Multi Select — shadcn Checkbox */}
                                  {isMulti && (
                                    <div className="space-y-2">
                                      <div className="max-h-40 overflow-auto rounded-md border border-border p-2">
                                        {options.length ? (
                                          options.map((opt, i) => {
                                            const selected = Array.isArray(service?.details?.packages)
                                              ? service.details.packages.includes(opt.name)
                                              : false;

                                            return (
                                              <div
                                                key={i}
                                                className="flex items-center justify-between gap-3 py-1 px-2 rounded hover:bg-muted/50"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <Checkbox
                                                    id={`svc-${index}-opt-${i}`}
                                                    checked={selected}
                                                    onCheckedChange={(checked) => {
                                                      const prev = Array.isArray(service?.details?.packages)
                                                        ? [...service.details.packages]
                                                        : [];
                                                      if (checked) {
                                                        if (!prev.includes(opt.name)) prev.push(opt.name);
                                                      } else {
                                                        const idx = prev.indexOf(opt.name);
                                                        if (idx >= 0) prev.splice(idx, 1);
                                                      }
                                                      updateServiceDetail(index, "packages", prev);
                                                    }}
                                                  />
                                                  <Label
                                                    htmlFor={`svc-${index}-opt-${i}`}
                                                    className="text-sm font-normal cursor-pointer"
                                                  >
                                                    {opt.name}
                                                  </Label>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                  {formatPrice(Number(opt.price))}
                                                </span>
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <div className="text-xs text-muted-foreground">No options configured.</div>
                                        )}
                                      </div>

                                      {(!service?.details?.packages || service.details.packages.length === 0) ? (
                                        <p className="text-xs text-destructive">Pick at least one option.</p>
                                      ) : (
                                        <p className="text-xs text-muted-foreground">
                                          Selected: {service.details.packages.join(", ")}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Per Unit */}
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
                                        <p className="text-xs text-destructive">
                                          {unitName ? `${unitName} is required.` : "Amount is required."}
                                        </p>
                                      ) : (
                                        <p className="text-xs text-muted-foreground">
                                          Enter the {unitName || "amount"} for this service.
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Questions */}
                                  {selectedService && (
                                    <div className="space-y-3">
                                      {isLoadingQuestions && (
                                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
                                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                          <span className="text-sm text-foreground">Loading questions...</span>
                                        </div>
                                      )}

                                      {!isLoadingQuestions && hasQuestions && (
                                        <div className="p-3 bg-muted rounded-lg border border-border">
                                          <div className="flex items-center gap-2 mb-2">
                                            <HelpCircle className="h-4 w-4 text-foreground" />
                                            <h5 className="font-medium text-sm text-foreground">
                                              Please answer these questions:
                                            </h5>
                                          </div>
                                          {questions.map((question, qIndex) => (
                                            <div key={qIndex} className="space-y-1">
                                              <div className="flex items-start gap-2">
                                                <div className="flex-shrink-0 mt-1">
                                                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                                    {qIndex + 1}
                                                  </div>
                                                </div>
                                                <div className="flex-1">
                                                  <Label className="text-sm font-medium text-foreground">
                                                    {question}
                                                  </Label>
                                                  <Input
                                                    placeholder="Your answer..."
                                                    value={service?.details?.answers?.[qIndex] || ""}
                                                    onChange={(e) => {
                                                      const currentAnswers = service?.details?.answers || [];
                                                      const newAnswers = [...currentAnswers];
                                                      newAnswers[qIndex] = e.target.value;
                                                      updateServiceDetail(index, "answers", newAnswers);
                                                    }}
                                                    className="mt-1"
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {!isLoadingQuestions && !hasQuestions && checkedServices.has(service.id) && (
                                        <div className="p-3 bg-muted rounded-lg border border-border">
                                          <div className="flex items-center gap-2">
                                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                              No questions required for this service
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addService}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Service
                      </Button>

                      {errors.services && (
                        <p className="text-destructive text-sm">{errors.services}</p>
                      )}
                    </div>
                  </fieldset>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderForm;
