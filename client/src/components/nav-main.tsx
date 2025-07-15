"use client";

import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
  }[];
}

export function NavMain({ label, items }: Props) {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [clickedItem, setClickedItem] = useState<string | null>(null);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const isCollapsed = state === "collapsed";

  const handleMobileMenuClick = (itemTitle: string) => {
    if (isMobile) {
      // Provide visual feedback
      setClickedItem(itemTitle);
      
      // Add a small delay to allow the navigation to start before closing
      setTimeout(() => {
        setOpenMobile(false);
        setClickedItem(null);
      }, 200);
    }
  };

  return (
    <SidebarGroup className="transition-all duration-300 ease-in-out">
      <SidebarGroupLabel 
        className={cn(
          "transition-all duration-300 ease-in-out",
          isCollapsed && !isMobile && "opacity-0 scale-95"
        )}
      >
        {label}
      </SidebarGroupLabel>
      <Separator className={cn(
        "mb-2 transition-all duration-300 ease-in-out",
        isCollapsed && !isMobile && "opacity-50"
      )} />
      <SidebarMenu className="space-y-1">
        {items.map((item, index) => {
          const active = isActive(item.url);
          const isHovered = hoveredItem === item.title;
          const isClicked = clickedItem === item.title;
          
          return (
            <SidebarMenuItem 
              key={item.title}
              className={cn(
                "transition-all duration-300 ease-in-out",
                "animate-in slide-in-from-left-2",
                isMobile && "hover:scale-[0.98]"
              )}
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: "both"
              }}
              onMouseEnter={() => setHoveredItem(item.title)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <SidebarMenuButton
                asChild
                tooltip={isCollapsed && !isMobile ? item.title : undefined}
                isActive={active}
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  "hover:scale-105 hover:shadow-sm",
                  active && "bg-primary/10 border-l-2 border-primary shadow-sm",
                  isHovered && !active && "bg-muted/50 scale-[1.02]",
                  isClicked && isMobile && "bg-primary/20 scale-95 shadow-lg",
                  isCollapsed && !isMobile && "justify-center px-2",
                  isMobile && "py-3 px-4 rounded-lg"
                )}
              >
                <Link 
                  href={item.url} 
                  className={cn(
                    "flex items-center gap-3 w-full transition-all duration-300",
                    isCollapsed && !isMobile && "justify-center"
                  )}
                  onClick={() => handleMobileMenuClick(item.title)}
                >
                  {item.icon && (
                    <item.icon 
                      className={cn(
                        "transition-all duration-300 ease-in-out",
                        active && "text-primary scale-110",
                        isHovered && !active && "scale-105",
                        isCollapsed && !isMobile ? "h-5 w-5" : "h-4 w-4"
                      )} 
                    />
                  )}
                  <span 
                    className={cn(
                      "transition-all duration-300 ease-in-out font-medium",
                      active && "text-primary font-semibold",
                      isCollapsed && !isMobile && "sr-only",
                      isMobile && "text-sm"
                    )}
                  >
                    {item.title}
                  </span>
                  {active && !isCollapsed && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
