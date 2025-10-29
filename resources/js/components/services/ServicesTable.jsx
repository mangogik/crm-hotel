import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import ServiceTableRow from "./ServiceTableRow";

const ServicesTable = ({
  services,
  expandedRows,
  toggleRow,
  openEditModal,
  openDeleteModal,
  openImagesModal, // NEW: dari parent Services.jsx
  formatPrice,
  formatType,
  formatFulfillment,
  sortBy,
  sortDirection,
  handleSort,
  getTypeBadge,
  getFulfillmentBadge,
  getOfferingSessionBadge,
}) => {
  const SortableHeader = ({ field, children }) => (
    <TableHead className="cursor-pointer" onClick={() => handleSort(field)}>
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortBy === field && (
          <ArrowUpDown
            className={`h-3 w-3 ${
              sortDirection === "asc" ? "rotate-180" : ""
            }`}
          />
        )}
      </div>
    </TableHead>
  );

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>

            <SortableHeader field="name">Name</SortableHeader>
            <SortableHeader field="type">Type</SortableHeader>
            <SortableHeader field="fulfillment_type">
              Fulfillment
            </SortableHeader>

            <SortableHeader field="offering_session">Session</SortableHeader>

            <SortableHeader field="price">Price</SortableHeader>

            <TableHead>Questions</TableHead>

            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {services.length > 0 ? (
            services.map((service) => (
              <ServiceTableRow
                key={service.id}
                service={service}
                isExpanded={expandedRows.includes(service.id)}
                onToggle={() => toggleRow(service.id)}

                // penting: stopPropagation sudah di-handle di row sendiri,
                // tapi kita aman aja lewatin fungsinya langsung
                onEdit={(e) => {
                  e?.stopPropagation?.();
                  openEditModal(service);
                }}
                onDelete={(e) => {
                  e?.stopPropagation?.();
                  openDeleteModal(service);
                }}

                // NEW: pass handler buat buka modal gambar
                onOpenImages={(s) => {
                  // s biasanya == service dari row
                  openImagesModal(s);
                }}

                formatPrice={formatPrice}
                formatType={formatType}
                formatFulfillment={formatFulfillment}
                getTypeBadge={getTypeBadge}
                getFulfillmentBadge={getFulfillmentBadge}
                getOfferingSessionBadge={getOfferingSessionBadge}
              />
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center py-8 text-muted-foreground text-sm"
              >
                No services found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ServicesTable;
