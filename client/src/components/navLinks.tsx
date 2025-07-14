"use client";

import { Dock, DollarSign, Home, Laptop, PanelLeft } from "lucide-react";
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
