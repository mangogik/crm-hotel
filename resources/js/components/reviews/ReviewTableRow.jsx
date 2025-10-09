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
  ChevronDown,
  ChevronRight,
  Info,
  User,
  Star,
  Mail,
  Phone,
  Globe,
} from "lucide-react";

const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
          }`}
        />
      ))}
      <span className="ml-2 text-sm font-medium">{rating}/5</span>
    </div>
  );
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

const ReviewTableRow = ({ review, isExpanded, onToggle, formatDate }) => {
  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <TableCell className="w-12">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell className="font-medium">{review.customer?.name || 'Unknown'}</TableCell>
        <TableCell>
          <StarRating rating={review.rating} />
        </TableCell>
        <TableCell>
          <div className="max-w-xs truncate">
            {review.comment || <span className="text-muted-foreground">No comment</span>}
          </div>
        </TableCell>
        <TableCell>{formatDate(review.created_at)}</TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow>
          <TableCell colSpan={5} className="p-0">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Customer Details */}
                <DetailCard
                  title="Customer Details"
                  icon={User}
                  headerBg="bg-blue-100"
                  headerText="text-blue-600"
                >
                  <DetailItem label="Name" value={review.customer?.name} />
                  <DetailItem label="Email" value={review.customer?.email} />
                  <DetailItem label="Phone" value={review.customer?.phone} />
                  <DetailItem label="Country" value={review.customer?.passport_country} />
                </DetailCard>

                {/* Review Details */}
                <DetailCard
                  title="Review Details"
                  icon={Star}
                  headerBg="bg-yellow-100"
                  headerText="text-yellow-600"
                >
                  <DetailItem label="Rating">
                    <StarRating rating={review.rating} />
                  </DetailItem>
                  <DetailItem label="Created At" value={formatDate(review.created_at)} />
                </DetailCard>

                {/* Comment */}
                <DetailCard
                  title="Comment"
                  icon={Mail}
                  headerBg="bg-green-100"
                  headerText="text-green-600"
                >
                  <div className="bg-white p-4 rounded-lg border min-h-[150px]">
                    {review.comment ? (
                      <p className="text-sm whitespace-pre-wrap">{review.comment}</p>
                    ) : (
                      <p className="text-muted-foreground text-sm">No comment provided</p>
                    )}
                  </div>
                </DetailCard>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default ReviewTableRow;