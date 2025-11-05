import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, CheckCircle2 } from "lucide-react";

const ServiceFilters = ({
  searchTerm,
  setSearchTerm,
  selectedType,
  setSelectedType,
  selectedFulfillment,
  setSelectedFulfillment,
  selectedOfferingSession,
  setSelectedOfferingSession,
  categories = [],
  selectedCategory,
  setSelectedCategory,
  clearFilters,
  filterOptions,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /* ---------- helpers ---------- */
  const humanizeType = (t) => {
    if (t === "per_unit") return "Per Unit";
    if (t === "selectable") return "Selectable";
    if (t === "multiple_options") return "Multiple Options";
    if (t === "free") return "Free";
    return "Fixed Price";
  };
  const humanizeFulfillment = (f) =>
    f === "staff_assisted" ? "Staff Assisted" : "Direct";
  const humanizeSession = (s) =>
    s === "pre_checkin"
      ? "Pre Check-in"
      : s === "post_checkin"
      ? "Post Check-in"
      : "Pre Checkout";

  const typeOptions =
    filterOptions?.types ?? [
      "fixed",
      "per_unit",
      "selectable",
      "multiple_options",
      "free",
    ];
  const fulfillmentOptions =
    filterOptions?.fulfillment_types ?? ["direct", "staff_assisted"];
  const sessionOptions =
    filterOptions?.offering_sessions ?? [
      "pre_checkin",
      "post_checkin",
      "pre_checkout",
    ];

  const hasActiveFilters = () =>
    selectedType !== "all" ||
    selectedFulfillment !== "all" ||
    selectedOfferingSession !== "all" ||
    (selectedCategory && selectedCategory !== "all");

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedType !== "all") count++;
    if (selectedFulfillment !== "all") count++;
    if (selectedOfferingSession !== "all") count++;
    if (selectedCategory && selectedCategory !== "all") count++;
    return count;
  };

  const getActiveFilterLabels = () => {
    const labels = [];
    if (selectedType !== "all") labels.push(humanizeType(selectedType));
    if (selectedFulfillment !== "all")
      labels.push(humanizeFulfillment(selectedFulfillment));
    if (selectedOfferingSession !== "all")
      labels.push(humanizeSession(selectedOfferingSession));
    if (selectedCategory && selectedCategory !== "all") {
      const category = categories.find(
        (cat) => String(cat.id) === selectedCategory
      );
      labels.push(category ? category.name : `Category ID: ${selectedCategory}`);
    }
    return labels;
  };

  const isFilterActive = (filterType) => {
    switch (filterType) {
      case "category":
        return selectedCategory && selectedCategory !== "all";
      case "type":
        return selectedType !== "all";
      case "fulfillment":
        return selectedFulfillment !== "all";
      case "session":
        return selectedOfferingSession !== "all";
      default:
        return false;
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Search & Filter button */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button
            variant="outline"
            className="flex items-center gap-2 min-w-[120px] justify-between"
            onClick={() => setIsDialogOpen(true)}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            {hasActiveFilters() && (
              <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5">
                {getActiveFilterCount()}
              </span>
            )}
          </Button>

          <DialogContent
            className="sm:max-w-[500px] rounded-xl p-0 overflow-hidden"
            style={{
              maxHeight: "85vh",
              marginTop: "5vh",
              marginBottom: "5vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <DialogHeader className="p-4 pb-2 border-b">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5 text-green-600" />
                Filter Services
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Adjust filters to refine your service list.
              </DialogDescription>
            </DialogHeader>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Active filter badges */}
              {hasActiveFilters() && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="text-xs font-medium text-green-800 mb-1">
                    Active Filters:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {getActiveFilterLabels().map((label, index) => (
                      <Badge
                        key={index}
                        className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full"
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold">Category</label>
                  {isFilterActive("category") && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <Select
                  value={
                    selectedCategory === "all" || !selectedCategory
                      ? "all"
                      : String(selectedCategory)
                  }
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger
                    className={`w-full h-9 text-sm ${
                      isFilterActive("category")
                        ? "border-green-500 bg-green-50"
                        : ""
                    }`}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold">Type</label>
                  {isFilterActive("type") && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger
                    className={`w-full h-9 text-sm ${
                      isFilterActive("type")
                        ? "border-green-500 bg-green-50"
                        : ""
                    }`}
                  >
                    <SelectValue placeholder="Select type" />
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
              </div>

              {/* Fulfillment */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold">Fulfillment</label>
                  {isFilterActive("fulfillment") && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <Select
                  value={selectedFulfillment}
                  onValueChange={setSelectedFulfillment}
                >
                  <SelectTrigger
                    className={`w-full h-9 text-sm ${
                      isFilterActive("fulfillment")
                        ? "border-green-500 bg-green-50"
                        : ""
                    }`}
                  >
                    <SelectValue placeholder="Select fulfillment" />
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
              </div>

              {/* Session */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold">Session</label>
                  {isFilterActive("session") && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <Select
                  value={selectedOfferingSession}
                  onValueChange={setSelectedOfferingSession}
                >
                  <SelectTrigger
                    className={`w-full h-9 text-sm ${
                      isFilterActive("session")
                        ? "border-green-500 bg-green-50"
                        : ""
                    }`}
                  >
                    <SelectValue placeholder="Select session" />
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
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-muted/30 flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Filters apply automatically
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearFilters();
                  setIsDialogOpen(false);
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ServiceFilters;
