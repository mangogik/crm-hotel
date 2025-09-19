// resources/js/Layouts/AuthenticatedLayout.jsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { usePage } from "@inertiajs/react";

export default function AuthenticatedLayout({ children }) {
    const { auth } = usePage().props;

    return (
        <SidebarProvider>
            <div className="flex w-full h-screen">
                <AppSidebar auth={auth} />
                <main className="flex-1 overflow-y-auto py-4 px-6 md:ml-64">
                    <SidebarTrigger className="md:hidden mb-4" />
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
