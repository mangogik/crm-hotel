import {
    Home,
    User,
    HandPlatter,
    ClipboardList,
    BarChart3Icon,
    Sigma,
    Book,
    DoorOpen,
    CreditCard,
    TicketPercent,
    UserStar,
    ChevronUp,
    Bot, // <-- 1. IKON DITAMBAHKAN DI SINI
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

// ===== menu config (unchanged) =====
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
    // ===================================================================
    // 👇👇👇 2. GRUP BARU DITAMBAHKAN DI SINI 👇👇👇
    // ===================================================================
    {
        title: "Widgets",
        items: [
            {
                title: "Chat Bot", // Sesuai permintaan Anda
                url: "/chatbot-demo", // URL dari route
                icon: Bot, // Ikon baru
                allowedRoles: ["manager", "front-office"], // Sesuai route
            },
            {
                title: "Review Page",
                url: "/review-demo",
                icon: UserStar, // Menggunakan ikon yang sama dengan "Reviews"
                allowedRoles: ["manager", "front-office"],
            },
        ],
    },
    // ===================================================================
    // 👆👆👆 AKHIR PERUBAHAN 👆👆👆
    // ===================================================================
];

export function AppSidebar() {
    const { url, props } = usePage();
    const { hasAnyRole } = useAuth();

    // --- auth info ---
    const role = props?.auth?.user?.role || "";
    const userRole =
        role.length > 0 ? role.charAt(0).toUpperCase() + role.slice(1) : "";

    // --- branding / site info from AppServiceProvider ---
    // props.site bentuknya:
    // {
    //   name: "Wavin Hotel",
    //   tagline: "The Definition of Luxury.",
    //   logo: "http://localhost:8000/storage/logos/xxx.jpg",
    //   ...
    // }
    const site = props?.site || {};

    const hotelName = site.name || "CRM Hotel";
    const hotelTagline = site.tagline || userRole || "Staff Portal";
    const hotelLogoUrl = site.logo || null; // absolute URL sudah dirakit di AppServiceProvider

    // Extract the base path without query parameters
    const basePath = url.split("?")[0];

    return (
        <Sidebar className="bg-background w-64 flex-shrink-0">
            {/* ===== HEADER BRAND BLOCK ===== */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                {/* Logo box */}
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary overflow-hidden">
                                    {hotelLogoUrl ? (
                                        <img
                                            src={hotelLogoUrl}
                                            alt="Logo"
                                            className="w-6 h-6 object-contain"
                                            onError={(e) => {
                                                // kalau gagal load gambar, hide img dan fallback ke inisial
                                                e.currentTarget.style.display =
                                                    "none";
                                            }}
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded bg-slate-200 text-[10px] flex items-center justify-center font-semibold text-slate-600">
                                            {hotelName
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Text brand */}
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        {hotelName}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {hotelTagline}
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* ===== MENUS ===== */}
            <SidebarContent>
                {menuGroups.map((group) => {
                    // role gating
                    const permittedItems = group.items.filter((item) => {
                        if (item.allowedRoles) {
                            return hasAnyRole(item.allowedRoles);
                        }
                        return true;
                    });

                    if (permittedItems.length === 0) {
                        return null;
                    }

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
                                                        <span>
                                                            {item.title}
                                                        </span>
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

            {/* ===== FOOTER / USER DROPDOWN ===== */}
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger className="w-full">
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    {/* Avatar user */}
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage
                                            src={props.auth.user?.avatar_url}
                                            alt={props.auth.user?.name}
                                        />
                                        <AvatarFallback className="rounded-lg">
                                            {props.auth.user?.name
                                                ?.charAt(0)
                                                ?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Info user */}
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {props.auth.user?.name}
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {userRole}
                                        </span>
                                    </div>

                                    {/* caret icon */}
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
