// resources/js/components/bookings/BookingTableRow.jsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Info,
  User,
  Home,
  Tag,
} from "lucide-react";

const interactionDisplayMap = {
  view_services: { label: "Service Menu Opened" },
  req_svc: { label: "Service Details Viewed" },
  ord_svc: { label: "Option Selected" },
  confirm_ord: { label: "Order Confirmed" },
  payment: { label: "Payment Method Chosen" },
  rate: { label: "Rating Submitted" },
  cancel: { label: "Order Cancelled" },
};

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

const BookingTableRow = ({
  booking,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  formatDate,
  formatDateTime,
}) => {
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "checked_in":
        return "default";
      case "reserved":
        return "secondary";
      case "checked_out":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getSourceBadgeVariant = (src) => {
    switch ((src || "").toLowerCase()) {
      case "direct":
        return "purple";
      case "ota":
        return "info";
      case "agent":
        return "secondary";
      default:
        return "outline";
    }
  };

  const capitalizeWords = (str) => {
    if (!str) return "";
    return str
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <TableCell className="w-12">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>

        <TableCell className="font-medium">{booking.customer.name}</TableCell>

        <TableCell>
          {booking.room?.room_number ? (
            <Badge variant="outline">
              {booking.room.room_number}
              {booking.room?.room_type ? ` - ${booking.room.room_type}` : ""}
            </Badge>
          ) : (
            <span className="text-muted-foreground">No room</span>
          )}
        </TableCell>

        <TableCell>{formatDate(booking.checkin_at)}</TableCell>
        <TableCell>{formatDate(booking.checkout_at)}</TableCell>

        <TableCell>
          <Badge variant={getStatusBadgeVariant(booking.status)}>
            {capitalizeWords(booking.status)}
          </Badge>
        </TableCell>

        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(booking)}
              className="bg-secondary text-secondary-foreground"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(booking)}
              className="bg-destructive text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow>
          <TableCell colSpan={7} className="p-0">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Customer Details */}
                <DetailCard
                  title="Customer Details"
                  icon={User}
                  headerBg="bg-blue-100"
                  headerText="text-blue-600"
                >
                  <DetailItem label="Name" value={booking.customer?.name} />
                  <DetailItem label="Email" value={booking.customer?.email} />
                  <DetailItem label="Phone" value={booking.customer?.phone} />
                  <DetailItem
                    label="Country"
                    value={booking.customer?.passport_country}
                  />
                </DetailCard>

                {/* Booking Details (dengan Source & Status badge) */}
                <DetailCard
                  title="Booking Details"
                  icon={Info}
                  headerBg="bg-yellow-100"
                  headerText="text-yellow-600"
                >
                  <DetailItem label="Check-in" value={formatDate(booking.checkin_at)} />
                  <DetailItem label="Check-out" value={formatDate(booking.checkout_at)} />
                  <DetailItem label="Status">
                    <Badge variant={getStatusBadgeVariant(booking.status)}>
                      {capitalizeWords(booking.status)}
                    </Badge>
                  </DetailItem>
                  <DetailItem label="Source">
                    <Badge variant={getSourceBadgeVariant(booking.source)}>
                      {(booking.source || "—").toUpperCase()}
                    </Badge>
                  </DetailItem>
                </DetailCard>

                {/* Room & Notes */}
                <DetailCard
                  title="Room & Notes"
                  icon={Home}
                  headerBg="bg-green-100"
                  headerText="text-green-600"
                >
                  <DetailItem
                    label="Room"
                    value={
                      booking.room?.room_number
                        ? `#${booking.room.room_number}${
                            booking.room?.room_type ? ` (${booking.room.room_type})` : ""
                          }`
                        : "—"
                    }
                  />
                  <div className="text-sm">
                    <div className="text-muted-foreground mb-1">Notes:</div>
                    <div className="bg-white rounded-md border p-3 min-h-[80px]">
                      {booking.notes || "—"}
                    </div>
                  </div>
                </DetailCard>
              </div>

              {/* Interaction History (tetap tabel, tidak diubah) */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-indigo-600" />
                  <h4 className="font-semibold text-sm">Interaction History</h4>
                </div>
                <div className="border rounded-lg bg-background overflow-hidden">
                  <ScrollArea className="h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Interaction</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {booking.interactions && booking.interactions.length > 0 ? (
                          booking.interactions.map((interaction) => {
                            const interactionText =
                              interactionDisplayMap[interaction.interaction_type]?.label ||
                              capitalizeWords(interaction.interaction_type);

                            // jaga logic yang sudah benar
                            let detailText = interaction.details;
                            if (interaction.interaction_type === "view_services") {
                              detailText = "-";
                            } else if (
                              interaction.interaction_type === "payment" &&
                              interaction.metadata?.method
                            ) {
                              detailText = capitalizeWords(interaction.metadata.method);
                            }

                            return (
                              <TableRow key={interaction.id}>
                                <TableCell>{interactionText}</TableCell>
                                <TableCell>{detailText}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {formatDateTime(interaction.created_at)}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="h-24 text-center text-muted-foreground"
                            >
                              No interaction history found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default BookingTableRow;
