// resources/js/Layouts/AuthenticatedLayout.jsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { usePage, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronRight } from "lucide-react";

/**
 * Utility: "room_service" -> "Room Service"
 */
const toTitle = (str) => {
    if (!str) return "";
    return str
        .replace(/[-_]/g, " ")
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
};

/**
 * Build breadcrumbs from current URL
 * "/settings/advanced" -> [
 *   { href: "/settings", title: "Settings" },
 *   { href: "/settings/advanced", title: "Advanced" }
 * ]
 */
const getBreadcrumbItems = (url) => {
    const path = url.split("?")[0];
    const parts = path.split("/").filter(Boolean);

    return parts.map((part, index) => ({
        href: "/" + parts.slice(0, index + 1).join("/"),
        title: toTitle(part),
    }));
};

export default function AuthenticatedLayout({ children }) {
    // pull ALL shared props from Inertia
    const { url, props } = usePage();

    // these now come from AppServiceProvider boot()
    const { auth, site, secrets } = props;

    // still safe-guard user just in case
    const user = auth?.user ?? {};

    // build breadcrumb UI pieces
    const breadcrumbs = getBreadcrumbItems(url);
    const currentTitle =
        breadcrumbs.length > 0
            ? breadcrumbs[breadcrumbs.length - 1].title
            : "Dashboard";

    // Are we on dashboard/home?
    const isHome =
        currentTitle.toLowerCase() === "dashboard" || url === "/";

    return (
        <SidebarProvider>
            <div className="flex w-full h-screen overflow-hidden">
                {/* We can now pass site/secrets to the sidebar if it wants to show logo / hotel name / etc.
                   If your AppSidebar doesn't accept these props yet, it's still fine:
                   you can remove `site={site}` and `secrets={secrets}`. */}
                <AppSidebar auth={auth} site={site} secrets={secrets} />

                <main className="flex-1 flex flex-col md:ml-64 overflow-hidden">
                    {/* HEADER ELEGAN WARNA PUTIH */}
                    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 md:px-6 shadow-sm">
                        {/* Left side: breadcrumbs / page title */}
                        <div className="flex flex-1 items-center gap-2 overflow-hidden">
                            {!isHome ? (
                                <nav className="flex items-center space-x-1 text-sm text-gray-600">
                                    <Link
                                        href="/dashboard"
                                        className="transition-colors hover:text-gray-900"
                                    >
                                        Home
                                    </Link>

                                    {breadcrumbs.map((crumb, index) => (
                                        <div
                                            key={crumb.href}
                                            className="flex items-center space-x-1"
                                        >
                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                            {index ===
                                            breadcrumbs.length - 1 ? (
                                                <span className="font-medium text-gray-900">
                                                    {crumb.title}
                                                </span>
                                            ) : (
                                                <Link
                                                    href={crumb.href}
                                                    className="transition-colors hover:text-gray-900"
                                                >
                                                    {crumb.title}
                                                </Link>
                                            )}
                                        </div>
                                    ))}
                                </nav>
                            ) : (
                                <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
                                    {currentTitle}
                                </h1>
                            )}
                        </div>

                        {/* Right side: logout */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                            >
                                <Link href="/logout" method="post" as="button">
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden md:block ml-2">
                                        Log out
                                    </span>
                                </Link>
                            </Button>
                        </div>
                    </header>

                    {/* Konten Utama Halaman */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 px-2 py-4 md:py-6 md:px-4">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
