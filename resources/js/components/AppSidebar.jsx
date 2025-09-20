import {
    Home,
    User,
    HandPlatter,
    ClipboardList,
    History,
    Settings,
    ChevronUp,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    SidebarHeader,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Link, usePage } from "@inertiajs/react";
import Logo from "@/assets/images/Logo.jpg";

// Menu items, tambahkan allowedRoles
const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
        allowedRoles: ["manager", "front-office"], // contoh
    },
    {
        title: "Customers",
        url: "/customers",
        icon: User,
        allowedRoles: ["front-office"],
    },
    {
        title: "Services",
        url: "/services",
        icon: HandPlatter,
        allowedRoles: ["front-office"],
    },
    {
        title: "Orders",
        url: "/orders",
        icon: ClipboardList,
        allowedRoles: ["front-office"],
    },
    {
        title: "History",
        url: "/history",
        icon: History,
        allowedRoles: ["manager"],
    },
];

export function AppSidebar() {
    const { url } = usePage(); // <-- URL aktif dari Inertia
    const { hasAnyRole } = useAuth(); // <-- baca role user
    const { props } = usePage();
    const role = props.auth.user.role;
    const userRole = role.charAt(0).toUpperCase() + role.slice(1);

    // Extract the base path without query parameters
    const basePath = url.split('?')[0];

    return (
        <Sidebar className="bg-background w-64 flex-shrink-0">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary">
                                    <img
                                        src={Logo}
                                        alt=""
                                        className="w-6 h-6"
                                    />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        CRM Hotel
                                    </span>
                                    <span className="truncate text-xs">
                                        {userRole}
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => {
                                if (
                                    item.allowedRoles &&
                                    !hasAnyRole(item.allowedRoles)
                                ) {
                                    return null;
                                }

                                // Check if the base path matches the item URL
                                const active = basePath === item.url;

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            className={
                                                active
                                                    ? "bg-slate-200 text-accent-foreground"
                                                    : ""
                                            }
                                        >
                                            <Link href={item.url}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger className="w-full">
                                <SidebarMenuButton>
                                    <Settings /> Settings
                                    <ChevronUp className="ml-auto" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                className="w-[--radix-popper-anchor-width]"
                            >
                                <DropdownMenuItem>
                                    <Link
                                        href="/profile"
                                        as="button"
                                        className="w-full text-left"
                                    >
                                        Account
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="w-full text-left"
                                    >
                                        Sign out
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}