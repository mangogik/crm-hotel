import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export default function Layout({ children }) {
    return (
        <SidebarProvider>
            <div className="flex w-full h-screen">
                <AppSidebar />
                <main className="flex-1 overflow-y-auto py-2 pl-2 pr-4">
                    <SidebarTrigger className="md:hidden m-2" />
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
