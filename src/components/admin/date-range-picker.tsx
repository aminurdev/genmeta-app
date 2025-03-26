"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

interface DatePickerWithRangeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function DatePickerWithRange({ className }: DatePickerWithRangeProps) {
  return <div className={cn("grid gap-2", className)}></div>;
}
