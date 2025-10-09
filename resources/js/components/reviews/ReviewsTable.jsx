import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { ArrowUpDown, MessageSquare } from "lucide-react";
import ReviewTableRow from "@/components/reviews/ReviewTableRow";

const ReviewsTable = ({
    reviews,
    expandedRows,
    onToggle,
    handleSort,
    sortBy,
    sortDirection,
    formatDate,
}) => {
    const SortHead = ({ field, children }) => (
        <TableHead className="cursor-pointer" onClick={() => handleSort(field)}>
            <div className="flex items-center gap-1">
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
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12" />
                        <SortHead field="customer">Customer</SortHead>
                        <SortHead field="rating">Rating</SortHead>
                        <TableHead>Comment</TableHead>
                        <SortHead field="created_at">Review Date</SortHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reviews?.length ? (
                        reviews.map((review) => (
                            <ReviewTableRow
                                key={review.id}
                                review={review}
                                isExpanded={expandedRows.includes(review.id)}
                                onToggle={() => onToggle(review.id)}
                                formatDate={formatDate}
                            />
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                    <MessageSquare className="h-12 w-12 mb-2" />
                                    <p>No reviews found</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default ReviewsTable;