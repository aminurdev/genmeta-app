"use client";

import * as React from "react";
import { LayoutDashboard, Palette, UserIcon, Shield } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Logo } from "./Logo";
import { User } from "@/services/auth-services";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: UserIcon,
    },
    {
      title: "Appearance",
      url: "/dashboard/appearance",
      icon: Palette,
    },
  ],
  navAdmin: [
    {
      title: "Admin",
      url: "/admin",
      icon: Shield,
    },
  ],
};

interface Props {
  user?: User;
}
export function AppSidebar({ user }: Props) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Navigation" items={data.navMain} />
        {user?.role === "admin" && (
          <NavMain label="Admin Dashboard" items={data.navAdmin} />
        )}
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
