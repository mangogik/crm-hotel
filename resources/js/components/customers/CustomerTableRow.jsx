import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, ChevronDown, ChevronRight, User, IdCard, Calendar, Crown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ---------- Mini components (selaras dengan BookingTableRow) ---------- */
const DetailCard = ({ title, icon: Icon, headerBg, headerText, children }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 rounded-full ${headerBg}`}>
        <Icon className={`h-5 w-5 ${headerText}`} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

const DetailItem = ({ label, value, children }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}:</span>
    <span className="font-medium text-right">{value ?? children ?? "—"}</span>
  </div>
);

/* -------------------------------------------------------------------- */

const CustomerTableRow = ({
  customer,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  formatDate,
}) => {
  const getMembershipBadgeVariant = (type) => {
    switch (type) {
      case "platinum":
        return "default";
      case "gold":
        return "warning";
      case "silver":
        return "outline";
      default:
        return "destructive";
    }
  };

  const capitalizeWords = (str) =>
    String(str || "")
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  // Ambil nama-nama service dari order (diisi oleh controller sebagai service_names, fallback ke items[].name)
  const joinServiceNames = (order) => {
    if (Array.isArray(order?.service_names) && order.service_names.length) {
      return order.service_names.join(", ");
    }
    if (Array.isArray(order?.items) && order.items.length) {
      return order.items.map((it) => it.name).join(", ");
    }
    return "—";
  };

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <TableCell>
          <Button variant="ghost" size="sm">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>

        <TableCell className="font-medium">{customer.name}</TableCell>
        <TableCell>{customer.email || "N/A"}</TableCell>
        <TableCell>{customer.phone || "N/A"}</TableCell>
        <TableCell>
          {customer.passport_country && (
            <Badge variant="outline">{customer.passport_country}</Badge>
          )}
        </TableCell>
        <TableCell>
          {customer.birth_date ? formatDate(customer.birth_date) : "N/A"}
        </TableCell>
        <TableCell>
          <Badge variant="outline">
            {customer.total_visits}{" "}
            {customer.total_visits > 1 ? "Visits" : "Visit"}
          </Badge>
        </TableCell>
        <TableCell>
          {customer.membership ? (
            <Badge
              variant={getMembershipBadgeVariant(
                customer.membership.membership_type
              )}
            >
              {capitalizeWords(customer.membership.membership_type)}
              {customer.membership.discount_percentage > 0 &&
                ` (${customer.membership.discount_percentage}%)`}
            </Badge>
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="bg-secondary text-secondary-foreground"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow key={`${customer.id}-details`}>
          {/* Sesuaikan dengan jumlah kolom tabel utama */}
          <TableCell colSpan={9} className="p-0">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
              {/* Baris kartu ringkas (mirip BookingTableRow) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <DetailCard
                  title="Customer"
                  icon={User}
                  headerBg="bg-blue-100"
                  headerText="text-blue-600"
                >
                  <DetailItem label="Name" value={customer?.name} />
                  <DetailItem label="Email" value={customer?.email} />
                  <DetailItem label="Phone" value={customer?.phone} />
                  <DetailItem
                    label="Country"
                    value={customer?.passport_country}
                  />
                </DetailCard>

                <DetailCard
                  title="Identity"
                  icon={IdCard}
                  headerBg="bg-amber-100"
                  headerText="text-amber-600"
                >
                  <DetailItem
                    label="Birth Date"
                    value={customer.birth_date ? formatDate(customer.birth_date) : "N/A"}
                  />
                  <DetailItem label="Total Visits" value={customer.total_visits} />
                </DetailCard>

                <DetailCard
                  title="Membership"
                  icon={Crown}
                  headerBg="bg-purple-100"
                  headerText="text-purple-600"
                >
                  <DetailItem label="Type">
                    {customer.membership ? (
                      <Badge
                        variant={getMembershipBadgeVariant(
                          customer.membership.membership_type
                        )}
                      >
                        {capitalizeWords(customer.membership.membership_type)}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </DetailItem>
                  <DetailItem
                    label="Discount"
                    value={
                      customer.membership?.discount_percentage > 0
                        ? `${customer.membership.discount_percentage}%`
                        : "0%"
                    }
                  />
                  <DetailItem
                    label="Created"
                    value={
                      customer.created_at
                        ? new Date(customer.created_at).toLocaleDateString()
                        : "N/A"
                    }
                  />
                </DetailCard>
              </div>

              {/* Dua kolom tabel: Booking History & Order History */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                {/* LEFT: Booking History */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <h4 className="font-semibold text-sm">Booking History</h4>
                  </div>
                  <div className="border rounded-lg bg-background overflow-hidden">
                    <ScrollArea className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Check-in</TableHead>
                            <TableHead>Room</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customer.bookings && customer.bookings.length > 0 ? (
                            customer.bookings.map((b) => (
                              <TableRow key={b.id}>
                                <TableCell>
                                  {b.checkin_at ? formatDate(b.checkin_at) : "N/A"}
                                </TableCell>
                                <TableCell>{b.room_number || "N/A"}</TableCell>
                                <TableCell>{capitalizeWords(b.status)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="h-24 text-center text-muted-foreground"
                              >
                                No booking history found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>

                {/* RIGHT: Order History */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <h4 className="font-semibold text-sm">Order History</h4>
                  </div>
                  <div className="border rounded-lg bg-background overflow-hidden">
                    <ScrollArea className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Services</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customer.orders && customer.orders.length > 0 ? (
                            customer.orders.map((o) => (
                              <TableRow key={o.id}>
                                <TableCell>
                                  {o.created_at
                                    ? new Date(o.created_at).toLocaleDateString()
                                    : "N/A"}
                                </TableCell>
                                <TableCell className="max-w-[280px]">
                                  <div className="truncate">{joinServiceNames(o)}</div>
                                </TableCell>
                                <TableCell>{capitalizeWords(o.status)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="h-24 text-center text-muted-foreground"
                              >
                                No order history found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default CustomerTableRow;
