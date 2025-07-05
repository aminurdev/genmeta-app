import type React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app/app-sidebar";
import { getCurrentUser } from "@/services/auth-services";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <div>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar user={user ?? undefined} />
          <div className="w-full">{children}</div>
        </div>
      </SidebarProvider>
    </div>
  );
}
