import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

const ServiceFilters = ({
  searchTerm,
  setSearchTerm,
  selectedType,
  setSelectedType,
  selectedFulfillment,
  setSelectedFulfillment,
  selectedOfferingSession,
  setSelectedOfferingSession,
  clearFilters,
  // NEW: ambil opsi dari backend (ServiceController@index -> filterOptions)
  filterOptions,
}) => {
  // Fallback kalau props belum tersedia
  const typeOptions = filterOptions?.types ?? ["fixed", "per_unit", "selectable", "multiple_options", "free"];
  const fulfillmentOptions = filterOptions?.fulfillment_types ?? ["direct", "staff_assisted"];
  const sessionOptions = filterOptions?.offering_sessions ?? ["pre_checkin", "post_checkin", "pre_checkout"];

  const humanizeType = (t) => {
    if (t === "per_unit") return "Per Unit";
    if (t === "selectable") return "Selectable";
    if (t === "multiple_options") return "Multiple Options";
    if (t === "free") return "Free";
    return "Fixed Price";
  };

  const humanizeFulfillment = (f) => (f === "staff_assisted" ? "Staff Assisted" : "Direct");

  const humanizeSession = (s) =>
    s === "pre_checkin" ? "Pre Check-in" : s === "post_checkin" ? "Post Check-in" : "Pre Checkout";

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {/* Type */}
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {typeOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {humanizeType(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Fulfillment */}
        <Select value={selectedFulfillment} onValueChange={setSelectedFulfillment}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Fulfillment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fulfillments</SelectItem>
            {fulfillmentOptions.map((f) => (
              <SelectItem key={f} value={f}>
                {humanizeFulfillment(f)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Offering Session */}
        <Select value={selectedOfferingSession} onValueChange={setSelectedOfferingSession}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Session" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            {sessionOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {humanizeSession(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
          <X className="h-4 w-4" /> Clear Sort & Filters
        </Button>
      </div>
    </div>
  );
};

export default ServiceFilters;
