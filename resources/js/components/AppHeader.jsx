// resources/js/components/AppPageHeader.jsx
import { usePage } from "@inertiajs/react";
import { Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { User, LogOut, Settings, ChevronRight } from "lucide-react";

// Fungsi helper untuk membuat judul dari path
const getTitleFromPath = (url) => {
    const path = url.split('?')[0];
    if (path === '/' || path === '/dashboard') return 'Dashboard';

    const parts = path.split('/').filter(Boolean);
    const title = parts[parts.length - 1];

    return title
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Komponen menu pengguna yang diekstrak
const UserMenu = ({ user }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                    </p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/logout" method="post" as="button" className="w-full cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </Link>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

export default function AppHeader() {
    const { url, props } = usePage();
    const { auth } = props;
    const user = auth.user;

    const title = getTitleFromPath(url);
    const pathSegments = url.split('/').filter(Boolean);
    const isHomePage = pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === 'dashboard');

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
            <SidebarTrigger className="-ml-1" />
            
            {/* Breadcrumb & Title */}
            <div className="flex flex-1 items-center gap-2">
                {!isHomePage && (
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href="/dashboard">Dashboard</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {pathSegments.map((segment, index) => {
                                const href = '/' + pathSegments.slice(0, index + 1).join('/');
                                const isLast = index === pathSegments.length - 1;
                                const segmentTitle = getTitleFromPath(href);

                                return (
                                    <React.Fragment key={href}>
                                        <BreadcrumbSeparator>
                                            <ChevronRight className="h-4 w-4" />
                                        </BreadcrumbSeparator>
                                        <BreadcrumbItem>
                                            {isLast ? (
                                                <BreadcrumbPage>{segmentTitle}</BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink asChild>
                                                    <Link href={href}>{segmentTitle}</Link>
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                    </React.Fragment>
                                );
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>
                )}
                {isHomePage && (
                    <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>
                )}
            </div>

            {/* User Menu */}
            <UserMenu user={user} />
        </header>
    );
}