"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbConfig {
  [key: string]: {
    label: string;
    href?: string;
  };
}

// Configure custom labels for specific routes
const breadcrumbConfig: BreadcrumbConfig = {
  "/": { label: "Home" },
  "/dashboard": { label: "Dashboard" },
};

// Helper function to format segment names
function formatSegment(segment: string): string {
  // Remove hyphens and underscores, capitalize words
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Helper function to get breadcrumb label
function getBreadcrumbLabel(path: string, segment: string): string {
  // Check if there's a custom configuration for this path
  if (breadcrumbConfig[path]) {
    return breadcrumbConfig[path].label;
  }

  // Check if the segment is a UUID or ID (numbers/letters combination)
  if (
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      segment
    )
  ) {
    return "Details";
  }

  // Check if it's a numeric ID
  if (/^\d+$/.test(segment)) {
    return "Details";
  }

  // Format the segment
  return formatSegment(segment);
}

export function DynamicBreadcrumb() {
  const pathname = usePathname();

  // Don't show breadcrumb on home page
  if (pathname === "/") {
    return null;
  }

  // Split pathname into segments and filter out empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Generate breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    const label = getBreadcrumbLabel(path, segment);

    return {
      label,
      path,
      isLast,
    };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Home breadcrumb */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Dynamic breadcrumb items */}
        {breadcrumbItems.map((item) => (
          <div key={item.path} className="flex items-center gap-1">
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.path}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
