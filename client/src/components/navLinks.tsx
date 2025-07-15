"use client";

import {
  Dock,
  DollarSign,
  Home,
  Laptop,
  PanelLeft,
  ChevronRight,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import Link from "next/link";

export function NavLinks() {
  const pathname = usePathname();

  const links = [
    {
      href: "/",
      label: "Home",
      icon: <Home className="h-5 w-5 inline-block mr-2" />,
    },
    {
      href: "/pricing",
      label: "Pricing",
      icon: <DollarSign className="h-5 w-5 inline-block mr-1" />,
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <PanelLeft className="h-5 w-5 inline-block mr-2" />,
    },
    {
      href: "/download",
      label: "Get App Free",
      icon: <Laptop className="h-5 w-5 inline-block mr-2" />,
    },
    {
      href: "/docs",
      label: "Docs [Beta]",
      icon: <Dock className="h-5 w-5 inline-block mr-2" />,
    },
  ];

  return (
    <>
      {links.map((link) => (
        <Button
          className="h-8 rounded-sm hover:bg-muted/50 p-2"
          variant={"ghost"}
          size={"sm"}
          asChild
          key={link.href}
        >
          <Link
            href={link.href}
            className={`flex items-center ${
              pathname === link.href
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {link.icon} {link.label}
          </Link>
        </Button>
      ))}
    </>
  );
}

// Mobile-specific navigation component with enhanced UX
interface MobileNavLinksProps {
  onLinkClick: () => void;
}

export function MobileNavLinks({ onLinkClick }: MobileNavLinksProps) {
  const pathname = usePathname();

  const links = [
    {
      href: "/",
      label: "Home",
      icon: <Home className="h-5 w-5" />,
      description: "Back to homepage",
    },
    {
      href: "/pricing",
      label: "Pricing",
      icon: <DollarSign className="h-5 w-5" />,
      description: "View our plans",
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <PanelLeft className="h-5 w-5" />,
      description: "Manage your account",
    },
    {
      href: "/download",
      label: "Get App Free",
      icon: <Laptop className="h-5 w-5" />,
      description: "Download desktop app",
    },
    {
      href: "/docs",
      label: "Docs [Beta]",
      icon: <Dock className="h-5 w-5" />,
      description: "Documentation & guides",
    },
  ];

  return (
    <>
      {links.map((link, index) => {
        const isActive = pathname === link.href;
        return (
          <div
            key={link.href}
            className="transform transition-all duration-200 ease-in-out"
            style={{
              animationDelay: `${index * 50}ms`,
              animation: "slideInFromRight 0.3s ease-out forwards",
            }}
          >
            <Link
              href={link.href}
              onClick={onLinkClick}
              className={`group flex items-center justify-between w-full p-3 rounded-lg transition-all duration-200 hover:scale-[0.98] ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "bg-muted group-hover:bg-muted-foreground/20"
                  }`}
                >
                  {link.icon}
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm">{link.label}</span>
                  <span className="text-xs opacity-70">{link.description}</span>
                </div>
              </div>
              <ChevronRight
                className={`h-4 w-4 transition-all duration-200 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground group-hover:translate-x-1"
                }`}
              />
            </Link>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
