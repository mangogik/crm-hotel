// resources/js/Pages/Reviews.jsx
import { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import ReviewHeader from "@/components/reviews/ReviewHeader";
import ReviewFilters from "@/components/reviews/ReviewFilters";
import ReviewsTable from "@/components/reviews/ReviewsTable";
import Pagination from "@/components/reviews/Pagination";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Card, CardContent } from "@/components/ui/card";
import { fmtDate, fmtDateTime } from "@/lib/date";

export default function Reviews() {
    const { reviews, filters, totals, flash } = usePage().props;

    const [expandedRows, setExpandedRows] = useState([]);
    const [search, setSearch] = useState(filters.search || "");
    const [dateFrom, setDateFrom] = useState(filters.date_from || "");
    const [dateTo, setDateTo] = useState(filters.date_to || "");
    const [minRating, setMinRating] = useState(filters.min_rating || 0);
    const [sortBy, setSortBy] = useState(filters.sort_by || "created_at");
    const [sortDirection, setSortDirection] = useState(
        filters.sort_direction || "desc"
    );

    // Apply filters when they change
    useEffect(() => {
        const params = {
            search,
            date_from: dateFrom,
            date_to: dateTo,
            min_rating: minRating,
            sort_by: sortBy,
            sort_direction: sortDirection,
        };

        router.get(route("reviews.index"), params, {
            preserveState: true,
            replace: true,
        });
    }, [search, dateFrom, dateTo, minRating, sortBy, sortDirection]);

    const toggleRow = (id) => {
        setExpandedRows((prev) =>
            prev.includes(id)
                ? prev.filter((rowId) => rowId !== id)
                : [...prev, id]
        );
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortDirection("desc");
        }
    };

    const clearFilters = () => {
        setSearch("");
        setDateFrom("");
        setDateTo("");
        setMinRating(0);
        setSortBy("created_at");
        setSortDirection("desc");
    };

    const formatDate = fmtDate;

    const buildPaginationUrl = (url) => {
        if (!url) return null;
        const u = new URL(url);
        const params = new URLSearchParams(u.search);
        params.set("search", search);
        params.set("date_from", dateFrom);
        params.set("date_to", dateTo);
        params.set("min_rating", minRating);
        params.set("sort_by", sortBy);
        params.set("sort_direction", sortDirection);
        return `${u.pathname}?${params.toString()}`;
    };

    return (
        <div className="container mx-auto px-4">
            <ReviewHeader totals={totals} />
            <Card>
                <CardContent className="pt-0">
                    <ReviewFilters
                        search={search}
                        setSearch={setSearch}
                        dateFrom={dateFrom}
                        setDateFrom={setDateFrom}
                        dateTo={dateTo}
                        setDateTo={setDateTo}
                        minRating={minRating}
                        setMinRating={setMinRating}
                        clearFilters={clearFilters}
                    />
                    <ReviewsTable
                        reviews={reviews.data}
                        expandedRows={expandedRows}
                        onToggle={toggleRow}
                        handleSort={handleSort}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        formatDate={formatDate}
                    />
                    <Pagination
                        paginationData={reviews}
                        buildPaginationUrl={buildPaginationUrl}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

Reviews.layout = (page) => <AuthenticatedLayout children={page} />;
