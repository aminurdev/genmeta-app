import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = createMetadata({
  title: "Pricing & Plans — Free and Premium Stock Metadata | GenMeta",
  description:
    "Explore transparent pricing plans for GenMeta. Start free with 50 credits, or upgrade to Pro or Unlimited for high-volume batch stock metadata generation.",
  path: "/pricing",
  keywords: [
    "GenMeta pricing",
    "stock metadata generator pricing",
    "microstock keywording plans",
    "AI metadata credits",
  ],
});

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
