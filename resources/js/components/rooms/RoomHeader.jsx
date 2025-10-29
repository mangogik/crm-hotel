import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const RoomHeader = ({ onAddRoom }) => {
  return (
    <CardHeader>
      <div className="flex justify-between items-center">
        <div>
          <CardTitle className="text-2xl font-bold">Rooms</CardTitle>
          <CardDescription>Manage your hotel rooms and room types</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button onClick={onAddRoom} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Room
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};

export default RoomHeader;
