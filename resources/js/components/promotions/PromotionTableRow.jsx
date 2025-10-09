// resources/js/components/promotions/PromotionTableRow.jsx
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
  Package,
  Star,
  CheckCircle,
} from "lucide-react";

const TypeBadge = ({ type }) => {
  const map = {
    birthday: { label: "Birthday", variant: "purple" },
    event: { label: "Event", variant: "secondary" },
    membership: { label: "Membership", variant: "info" },
  };
  const { label, variant } = map[type] || { label: type, variant: "outline" };
  return (
    <Badge variant={variant} className="capitalize px-3 py-1 text-xs">
      {label}
    </Badge>
  );
};

const ActiveBadge = ({ isActive }) =>
  isActive ? (
    <Badge variant="success" className="px-3 py-1 text-xs">Active</Badge>
  ) : (
    <Badge variant="destructive" className="px-3 py-1 text-xs">Inactive</Badge>
  );

/** small shared bits */
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

const PromotionTableRow = ({ promotion, isExpanded, onToggle, onEdit, onDelete, formatDate, formatDateTime }) => {
  const actionLabel = promotion.discount_percent
    ? `${promotion.discount_percent}%`
    : promotion.discount_amount
    ? `IDR ${new Intl.NumberFormat("id-ID").format(Number(promotion.discount_amount))}`
    : promotion.free_service?.name
    ? `Free: ${promotion.free_service.name} x${promotion.free_service_qty || 1}`
    : "—";

  return (
    <>
      {/* top row (unchanged) */}
      <TableRow
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <TableCell className="w-12">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell className="font-medium">{promotion.name}</TableCell>
        <TableCell><TypeBadge type={promotion.type} /></TableCell>
        <TableCell>{actionLabel}</TableCell>
        <TableCell><ActiveBadge isActive={!!promotion.active} /></TableCell>
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

      {/* expanded details — three equal boxes */}
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={8} className="p-0">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* 1/3 Details */}
                <DetailCard
                  title="Details"
                  icon={Info}
                  headerBg="bg-blue-100"
                  headerText="text-blue-600"
                >
                  <DetailItem label="Name" value={promotion.name} />
                  <DetailItem label="Type"><TypeBadge type={promotion.type} /></DetailItem>
                  <DetailItem label="Status"><ActiveBadge isActive={!!promotion.active} /></DetailItem>
                  <DetailItem
                    label="Usage"
                    value={new Intl.NumberFormat("id-ID").format(Number(promotion.usages_count || 0))}
                  />
                  {promotion.created_at && <DetailItem label="Created At" value={formatDate(promotion.created_at)} />}
                  {promotion.updated_at && <DetailItem label="Updated At" value={formatDate(promotion.updated_at)} />}
                </DetailCard>

                {/* 2/3 Action */}
                <DetailCard
                  title="Action"
                  icon={Package}
                  headerBg="bg-green-100"
                  headerText="text-green-600"
                >
                  <DetailItem
                    label="Discount %"
                    value={promotion.discount_percent ? `${promotion.discount_percent}%` : "—"}
                  />
                  <DetailItem
                    label="Discount Amount"
                    value={
                      promotion.discount_amount
                        ? `IDR ${new Intl.NumberFormat("id-ID").format(Number(promotion.discount_amount))}`
                        : "—"
                    }
                  />
                  <DetailItem
                    label="Free Service"
                    value={
                      promotion.free_service?.name
                        ? `${promotion.free_service.name} x${promotion.free_service_qty || 1}`
                        : "—"
                    }
                  />
                </DetailCard>

                {/* 3/3 Eligible Services */}
                <DetailCard
                  title="Eligible Services"
                  icon={Star}
                  headerBg="bg-purple-100"
                  headerText="text-purple-600"
                >
                  {promotion.services?.length ? (
                    <div className="border rounded-lg bg-background overflow-hidden">
                      <ScrollArea className="h-40">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Service</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {promotion.services.map((s) => (
                              <TableRow key={s.id}>
                                <TableCell className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span>{s.name}</span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="text-sm text-center text-muted-foreground py-6">
                      All services are eligible.
                    </div>
                  )}
                </DetailCard>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default PromotionTableRow;
