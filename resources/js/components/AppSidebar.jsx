import {
    Home,
    User,
    HandPlatter,
    ClipboardList,
    ChartLine,
    Sigma,
    Book,
    DoorClosed,
    DoorOpen,
    Settings,
    ChevronUp,
    BarChart3Icon,
    CreditCard,
    TicketPercent,
    UserStar,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, usePage } from "@inertiajs/react";
import Logo from "@/assets/images/Logo.jpg";

// Menu items dikelompokkan berdasarkan fungsinya
const menuGroups = [
    {
        title: "Main",
        items: [
            {
                title: "Dashboard",
                url: "/dashboard",
                icon: Home,
                allowedRoles: ["manager", "front-office"],
            },
        ],
    },
    {
        title: "Operations",
        items: [
            {
                title: "Customers",
                url: "/customers",
                icon: User,
                allowedRoles: ["front-office"],
            },
            {
                title: "Bookings",
                url: "/bookings",
                icon: Book,
                allowedRoles: ["front-office"],
            },
            {
                title: "Rooms",
                url: "/rooms",
                icon: DoorOpen,
                allowedRoles: ["front-office"],
            },
        ],
    },
    {
        title: "Guest Services",
        items: [
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
                title: "Payments",
                url: "/payments",
                icon: CreditCard,
                allowedRoles: ["front-office"],
            },
            {
                title: "Promotions",
                url: "/promotions",
                icon: TicketPercent,
                allowedRoles: ["front-office"],
            },
        ],
    },
    {
        title: "Analytics",
        items: [
            {
                title: "Reviews",
                url: "/reviews",
                icon: UserStar,
                allowedRoles: ["manager", "front-office"],
            },
            {
                title: "Reports",
                url: "/reports",
                icon: BarChart3Icon,
                allowedRoles: ["manager", "front-office"],
            },
            {
                title: "AI Analytics",
                url: "/ai/analytics",
                icon: Sigma,
                allowedRoles: ["manager", "front-office"],
            },
        ],
    },
];

export function AppSidebar() {
    const { url } = usePage();
    const { hasAnyRole } = useAuth();
    const { props } = usePage();
    const role = props.auth.user.role;
    const userRole = role.charAt(0).toUpperCase() + role.slice(1);

    // Extract the base path without query parameters
    const basePath = url.split("?")[0];

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
                {/* Mapping melalui setiap grup menu untuk merender section */}
                {menuGroups.map((group) => {
                    // 1. Filter item-item yang diizinkan untuk user saat ini
                    const permittedItems = group.items.filter((item) => {
                        if (item.allowedRoles) {
                            return hasAnyRole(item.allowedRoles);
                        }
                        // Jika tidak ada allowedRoles, anggap semua user bisa melihat
                        return true;
                    });

                    // 2. Jika tidak ada item yang diizinkan, jangan render grup sama sekali
                    if (permittedItems.length === 0) {
                        return null;
                    }

                    // 3. Jika ada item yang diizinkan, render grup dengan item-item tersebut
                    return (
                        <SidebarGroup key={group.title}>
                            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {permittedItems.map((item) => {
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
                    );
                })}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger className="w-full">
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    {/* Avatar */}
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        {/* Ganti dengan URL avatar jika ada */}
                                        <AvatarImage
                                            src={props.auth.user.avatar_url}
                                            alt={props.auth.user.name}
                                        />
                                        <AvatarFallback className="rounded-lg">
                                            {props.auth.user.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {/* Info User */}
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {props.auth.user.name}
                                        </span>
                                        <span className="truncate text-xs">
                                            {userRole}
                                        </span>
                                    </div>
                                    {/* Icon */}
                                    <ChevronUp className="ml-auto transition-transform duration-200 group-data-[state=open]/dropdown-menu:rotate-180" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg"
                                align="start"
                            >
                                <DropdownMenuItem asChild>
                                    <Link
                                        href="/profile"
                                        className="cursor-pointer"
                                    >
                                        {/* Anda bisa tambahkan icon di sini jika mau */}
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href="/settings"
                                        className="cursor-pointer"
                                    >
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="w-full cursor-pointer"
                                    >
                                        Log out
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