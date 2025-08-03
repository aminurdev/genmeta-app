"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function Analytics() {
  const pathname = usePathname();
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    if (!(window as any).gtag) return;
    (window as any).gtag("config", GA_MEASUREMENT_ID, {
      page_path: pathname,
    });
  }, [pathname, GA_MEASUREMENT_ID]);

  return null;
}
