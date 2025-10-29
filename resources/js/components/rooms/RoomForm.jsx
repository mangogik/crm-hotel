// resources/js/components/rooms/RoomForm.jsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { Plus, Home, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RoomTypeForm from "./RoomTypeForm";

const RoomForm = ({
  roomTypes = [],
  initialData = null,
  onSuccess,
  onCancel,
  onModeChange,
}) => {
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  const isEditMode = !!initialData;

  const { data, setData, post, put, processing, errors, reset } = useForm({
    is_range: false,
    room_number: initialData?.room_number || "",
    start_room: "",
    end_room: "",
    room_type_id:
      initialData?.room_type_id ||
      initialData?.room_type?.id || // kalau data dari with('roomType')
      "",
    status: initialData?.status || "available",
  });

  useEffect(() => {
    if (onModeChange) onModeChange(isRangeMode);
  }, [isRangeMode, onModeChange]);

  const handleRangeToggle = (checked) => {
    setIsRangeMode(checked);
    setData("is_range", checked);
    if (checked) {
      setData("room_number", "");
    } else {
      setData("start_room", "");
      setData("end_room", "");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isEditMode) {
      put(route("rooms.update", initialData.id), {
        onSuccess: () => {
          reset();
          onSuccess();
        },
      });
    } else {
      post(route("rooms.store"), {
        onSuccess: () => {
          reset();
          onSuccess();
        },
      });
    }
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const calculateRoomCount = () => {
    if (!isRangeMode || !data.start_room || !data.end_room) return 0;
    const startMatch = data.start_room.match(/^([^\d]*)(\d+)$/);
    const endMatch = data.end_room.match(/^([^\d]*)(\d+)$/);
    if (startMatch && endMatch && startMatch[1] === endMatch[1]) {
      const startNum = parseInt(startMatch[2]);
      const endNum = parseInt(endMatch[2]);
      return Math.max(0, endNum - startNum + 1);
    }
    if (!isNaN(data.start_room) && !isNaN(data.end_room)) {
      return Math.max(0, parseInt(data.end_room) - parseInt(data.start_room) + 1);
    }
    return 0;
  };

  const roomCount = calculateRoomCount();

  const afterCreateType = () => {
    setIsTypeModalOpen(false);
    // refresh agar roomTypes terbaru masuk ke props
    router.reload({ only: ["roomTypes"] });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Single Room Creation (Default) */}
        {!isRangeMode && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Single Room Creation
              </CardTitle>
              <CardDescription>Create a single room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room_number" className="text-right">
                  Room Number *
                </Label>
                <Input
                  id="room_number"
                  value={data.room_number}
                  onChange={(e) => setData("room_number", e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., 101, A201"
                />
                {errors.room_number && (
                  <p className="text-red-500 text-sm col-span-4 text-right">
                    {errors.room_number}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room_type_id" className="text-right">
                  Room Type *
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Select
                    value={String(data.room_type_id || "")}
                    onValueChange={(value) => setData("room_type_id", value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={() => setIsTypeModalOpen(true)}>
                    Add Type
                  </Button>
                </div>
                {errors.room_type_id && (
                  <p className="text-red-500 text-sm col-span-4 text-right">
                    {errors.room_type_id}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status *
                </Label>
                <Select value={data.status || "available"} onValueChange={(v) => setData("status", v)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-red-500 text-sm col-span-4 text-right">{errors.status}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Range Room Creation */}
        {isRangeMode && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Bulk Room Creation
              </CardTitle>
              <CardDescription>Create multiple rooms at once</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Range */}
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">Room Number Range</h4>
                    {roomCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {roomCount} rooms
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="start_room" className="text-xs font-medium">
                        Start *
                      </Label>
                      <Input
                        id="start_room"
                        value={data.start_room}
                        onChange={(e) => setData("start_room", e.target.value)}
                        className="h-8 text-sm"
                        placeholder="e.g., 101"
                      />
                      {errors.start_room && (
                        <p className="text-red-500 text-xs mt-1">{errors.start_room}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="end_room" className="text-xs font-medium">
                        End *
                      </Label>
                      <Input
                        id="end_room"
                        value={data.end_room}
                        onChange={(e) => setData("end_room", e.target.value)}
                        className="h-8 text-sm"
                        placeholder="e.g., 110"
                      />
                      {errors.end_room && (
                        <p className="text-red-500 text-xs mt-1">{errors.end_room}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-sm mb-2">Specifications</h4>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="room_type_id" className="text-xs font-medium">
                        Type *
                      </Label>
                      <div className="flex gap-2">
                        <Select
                          value={String(data.room_type_id || "")}
                          onValueChange={(v) => setData("room_type_id", v)}
                        >
                          <SelectTrigger className="h-8 text-sm flex-1">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {roomTypes.map((t) => (
                              <SelectItem key={t.id} value={String(t.id)}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsTypeModalOpen(true)}>
                          Add Type
                        </Button>
                      </div>
                      {errors.room_type_id && (
                        <p className="text-red-500 text-xs mt-1">{errors.room_type_id}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="status" className="text-xs font-medium">
                        Status *
                      </Label>
                      <Select value={data.status || "available"} onValueChange={(v) => setData("status", v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                    </div>
                  </div>
                </div>

                {/* How it works */}
                <div className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium text-sm">How it works</h4>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-start"><span className="inline-block mr-1">•</span><span>All rooms will have the same type & status</span></li>
                    <li className="flex items-start"><span className="inline-block mr-1">•</span><span>Numbers generated sequentially</span></li>
                    <li className="flex items-start"><span className="inline-block mr-1">•</span><span>Existing rooms will be skipped</span></li>
                    <li className="flex items-start"><span className="inline-block mr-1">•</span><span>Initial status applied to all</span></li>
                  </ul>
                  <div className="mt-3 text-xs">
                    <p className="font-medium text-muted-foreground">Examples:</p>
                    <p className="text-muted-foreground">101-110, A201-A210, B301-B305</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          {!isEditMode && (
            <Card className="flex flex-row items-center space-x-2 p-2 rounded-lg">
              <span className={`text-sm ${isRangeMode ? "font-medium" : "text-muted-foreground"}`}>
                Bulk Rooms
              </span>
              <button
                type="button"
                onClick={() => handleRangeToggle(!isRangeMode)}
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-muted"
                role="switch"
                aria-checked={isRangeMode}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                    isRangeMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </Card>
          )}

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? "Saving..." : isEditMode ? "Update Room" : "Create Room"}
            </Button>
          </div>
        </div>
      </form>

      {/* Add Room Type Modal */}
      <Dialog open={isTypeModalOpen} onOpenChange={setIsTypeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Room Type</DialogTitle>
          </DialogHeader>
          <RoomTypeForm
            onSuccess={afterCreateType}
            onCancel={() => setIsTypeModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RoomForm;
