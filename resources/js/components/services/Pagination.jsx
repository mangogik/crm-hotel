import { Button } from "@/components/ui/button";
import { router } from "@inertiajs/react";

const Pagination = ({ paginationData, buildPaginationUrl }) => {
    const { from, to, total, prev_page_url, next_page_url } = paginationData;

    const handleNavigation = (url) => {
        if (!url) return;
        router.get(buildPaginationUrl(url), {}, { preserveState: true, replace: true });
    };

    return (
        <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
                Showing {from} to {to} of {total} results
            </div>
            <div className="flex space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigation(prev_page_url)}
                    disabled={!prev_page_url}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigation(next_page_url)}
                    disabled={!next_page_url}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default Pagination;

