"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { Logo } from "./Logo";
import {
  CreditCard,
  LayoutDashboard,
  Package,
  Palette,
  UserIcon,
  Users,
  Clock,
  Phone,
  Mail,
} from "lucide-react";
import { User } from "@/services/auth-services";
import { Separator } from "./ui/separator";

const userSidebarData = [
  {
    label: "Navigation",
    isForAdmin: false,
    items: [
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
        title: "Referral",
        url: "/dashboard/referral",
        icon: Users, // Referral: using Users icon
      },
      {
        title: "Appearance",
        url: "/dashboard/appearance",
        icon: Palette,
      },
    ],
  },
  {
    label: "Contact",
    isForAdmin: false,
    items: [
      {
        title: "Mail",
        url: "mailto:support@genmeta.app",
        icon: Mail,
      },
      {
        title: "Whatsapp",
        url: "https://wa.me/+8801817710493",
        icon: Phone,
      },
    ],
  },
  {
    label: "Admin Dashboard",
    isForAdmin: true,
    items: [
      {
        title: "Admin",
        url: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
];

const adminSidebarData = [
  {
    label: "Overview",
    isForAdmin: true,
    items: [
      {
        title: "OverView",
        url: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Management",
    isForAdmin: true,
    items: [
      {
        title: "Users",
        url: "/admin/users",
        icon: Users,
      },
      {
        title: "Referral",
        url: "/admin/referral",
        icon: Users, // Referral: using Users icon
      },
      {
        title: "Payments",
        url: "/admin/payments",
        icon: CreditCard,
      },
      {
        title: "Manage Pricing",
        url: "/admin/manage-pricing",
        icon: Package,
      },
      {
        title: "Scheduler",
        url: "/admin/scheduler",
        icon: Clock,
      },
    ],
  },
  {
    label: "User",
    isForAdmin: false,
    items: [
      {
        title: "User Dashboard",
        url: "/dashboard",
        icon: Package,
      },
    ],
  },
];

export type AppSidebarProps = {
  user: User | null;
  type: "user" | "admin";
};

export function AppSidebar({ user, type }: AppSidebarProps) {
  const sidebarData = type === "admin" ? adminSidebarData : userSidebarData;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <Separator className="mb-2 -mt-px" />

      <SidebarContent>
        {sidebarData.map((section) => {
          const visibleItems = section.items.filter(() => {
            return !section.isForAdmin || user?.role === "admin";
          });

          if (visibleItems.length === 0) return null;

          return (
            <NavMain
              key={section.label}
              label={section.label}
              items={visibleItems}
            />
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
