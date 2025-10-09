import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";

const statuses = [
  { value: "reserved", label: "Reserved" },
  { value: "checked_in", label: "Checked In" },
  { value: "checked_out", label: "Checked Out" },
  { value: "cancelled", label: "Cancelled" },
];

export default function StatusEditor({ data, setData }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const prevStatusRef = useRef(data.status || "reserved");
  const pendingStatusRef = useRef(null);

  const isFuture = (() => {
    if (!data.checkin_at) return false;
    const now = new Date();
    const ci  = new Date(data.checkin_at);
    return ci.getTime() > now.getTime();
  })();

  const onChangeStatus = (next) => {
    if (next === "checked_in" && isFuture) {
      // stash desired change, show confirm
      pendingStatusRef.current = next;
      setConfirmOpen(true);
    } else {
      prevStatusRef.current = data.status || "reserved";
      setData("status", next);
      // ensure override flag is off if not needed
      setData("override_future_checkin", false);
    }
  };

  const onConfirm = () => {
    // proceed with override
    setData("status", pendingStatusRef.current);
    setData("override_future_checkin", true);
    prevStatusRef.current = pendingStatusRef.current;
    pendingStatusRef.current = null;
    setConfirmOpen(false);
  };

  const onCancel = () => {
    // revert selection
    pendingStatusRef.current = null;
    setData("status", prevStatusRef.current);
    setData("override_future_checkin", false);
    setConfirmOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Status</Label>
        <Select
          value={data.status || "reserved"}
          onValueChange={onChangeStatus}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set to Checked In with a future check-in time?</AlertDialogTitle>
            <AlertDialogDescription>
              This booking’s check-in time is in the future. Setting it to <b>Checked In</b> can create data inconsistencies.
              Proceed only if you understand this (e.g., testing or special case). You can change it back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>Proceed</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
