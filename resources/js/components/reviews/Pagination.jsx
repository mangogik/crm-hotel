// resources/js/components/reviews/Pagination.jsx
import { Button } from "@/components/ui/button";
import { router } from "@inertiajs/react";

const Pagination = ({ paginationData, buildPaginationUrl }) => {
    const handleNavigation = (url) => {
        if (!url) return;
        router.get(buildPaginationUrl(url), {}, { preserveState: true, replace: true });
    };

    return (
        <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
                Showing {paginationData?.from} to {paginationData?.to} of {paginationData?.total} results
            </div>
            <div className="flex space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigation(paginationData.prev_page_url)}
                    disabled={!paginationData?.prev_page_url}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigation(paginationData.next_page_url)}
                    disabled={!paginationData?.next_page_url}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default Pagination;