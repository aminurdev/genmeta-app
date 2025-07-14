"use client";

import * as React from "react";
import {
  Check,
  ChevronsUpDown,
  FileText,
  Search,
  BookOpen,
  Code,
  Zap,
  HelpCircle,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TableOfContents } from "@/components/docs/table-of-contents";

const data = {
  versions: ["1.0.0"],
  navMain: [
    {
      title: "Getting Started",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#introduction",
          isActive: true,
        },
        {
          title: "Installation",
          url: "#installation",
        },
        {
          title: "Setup",
          url: "#setup",
        },
        {
          title: "Quick Start",
          url: "#quick-start",
        },
      ],
    },
    {
      title: "Features",
      url: "#",
      icon: Zap,
      items: [
        {
          title: "AI Metadata Generation",
          url: "#ai-metadata",
        },
        {
          title: "Batch Processing",
          url: "#batch-processing",
        },
        {
          title: "Export Options",
          url: "#export-options",
        },
        {
          title: "Custom Keywords",
          url: "#custom-keywords",
        },
      ],
    },
    {
      title: "API Reference",
      url: "#",
      icon: FileText,
      items: [
        {
          title: "Authentication",
          url: "#authentication",
        },
        {
          title: "Endpoints",
          url: "#endpoints",
        },
        {
          title: "Rate Limits",
          url: "#rate-limits",
        },
        {
          title: "Error Codes",
          url: "#error-codes",
        },
      ],
    },
    {
      title: "Help & Support",
      url: "#",
      icon: HelpCircle,
      items: [
        {
          title: "FAQ",
          url: "#faq",
        },
        {
          title: "Troubleshooting",
          url: "#troubleshooting",
        },
        {
          title: "System Requirements",
          url: "#system-requirements",
        },
        {
          title: "Contact Support",
          url: "#contact-support",
        },
      ],
    },
  ],
};

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  const [selectedVersion, setSelectedVersion] = React.useState(
    data.versions[0]
  );

  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <FileText className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">Documentation</span>
                      <span className="text-xs">v{selectedVersion}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width]"
                  align="start"
                >
                  {data.versions.map((version) => (
                    <DropdownMenuItem
                      key={version}
                      onSelect={() => setSelectedVersion(version)}
                    >
                      v{version}{" "}
                      {version === selectedVersion && (
                        <Check className="ml-auto size-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
          <form>
            <SidebarGroup className="py-0">
              <SidebarGroupContent className="relative">
                <Label htmlFor="search" className="sr-only">
                  Search
                </Label>
                <SidebarInput
                  id="search"
                  placeholder="Search documentation..."
                  className="pl-8"
                />
                <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
              </SidebarGroupContent>
            </SidebarGroup>
          </form>
        </SidebarHeader>
        <SidebarContent>
          {data.navMain.map((item) => (
            <SidebarGroup key={item.title}>
              <SidebarGroupLabel className="flex items-center gap-2">
                <item.icon className="size-4" />
                {item.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {item.items.map((subItem) => (
                    <SidebarMenuItem key={subItem.title}>
                      <SidebarMenuButton asChild isActive={subItem.isActive}>
                        <a href={subItem.url}>{subItem.title}</a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Components</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Card</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1">
          <main className="flex-1 min-w-0">{children}</main>
          <aside className="hidden xl:block w-64 shrink-0 border-l">
            <TableOfContents />
          </aside>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
