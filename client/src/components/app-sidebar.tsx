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
  Database,
  ShieldAlert,
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
        icon: Users,
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
    label: "Super Admin",
    isForAdmin: true,
    isForSuperAdmin: true,
    items: [
      {
        title: "Super Admin Hub",
        url: "/admin/super-admin",
        icon: ShieldAlert,
        isForSuperAdmin: true,
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
        icon: Users,
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
      {
        title: "Backup",
        url: "/admin/backup",
        icon: Database,
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
  const isSuperAdmin = user?.role === "superAdmin";
  const isAdmin = user?.role === "admin" || isSuperAdmin;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <Separator className="mb-2 -mt-px" />

      <SidebarContent>
        {sidebarData.map((section) => {
          // If section is for superAdmin only, only show if user is superAdmin
          if ((section as { isForSuperAdmin?: boolean }).isForSuperAdmin && !isSuperAdmin) {
            return null;
          }

          // If section is for admin only, only show if user is admin or superAdmin
          if (section.isForAdmin && !isAdmin) {
            return null;
          }

          const visibleItems = section.items.filter((item) => {
            const itemIsForSuperAdmin = (item as { isForSuperAdmin?: boolean }).isForSuperAdmin;
            if (itemIsForSuperAdmin && !isSuperAdmin) return false;
            return !section.isForAdmin || isAdmin;
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
