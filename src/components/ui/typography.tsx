"use client";

import { ElementType, ReactNode } from "react";
import clsx from "clsx";

interface TypographyProps<T extends ElementType = "p"> {
  as?: T;
  children: ReactNode;
  className?: string;
  variant?: 
    | "display-2xl"
    | "display-xl"
    | "display-lg"
    | "display-md"
    | "display-sm"
    | "display-xs"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "body-lg"
    | "body-base"
    | "body-sm"
    | "body-xs"
    | "caption";
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "white";
  weight?: "normal" | "medium" | "semibold" | "bold";
  align?: "left" | "center" | "right";
}

const variants = {
  "display-2xl": "font-display text-display-2xl",
  "display-xl": "font-display text-display-xl",
  "display-lg": "font-display text-display-lg",
  "display-md": "font-display text-display-md",
  "display-sm": "font-display text-display-sm",
  "display-xs": "font-display text-display-xs",
  "h1": "text-4xl font-bold leading-tight",
  "h2": "text-3xl font-bold leading-tight",
  "h3": "text-2xl font-bold leading-tight",
  "h4": "text-xl font-bold leading-tight",
  "h5": "text-lg font-bold leading-tight",
  "h6": "text-base font-bold leading-tight",
  "body-lg": "text-lg leading-relaxed",
  "body-base": "text-base leading-relaxed",
  "body-sm": "text-sm leading-relaxed",
  "body-xs": "text-xs leading-relaxed",
  "caption": "text-sm leading-tight",
};

const colors = {
  primary: "text-primary-900",
  secondary: "text-secondary-900",
  success: "text-success-700",
  warning: "text-warning-700",
  error: "text-error-700",
  white: "text-white",
};

const weights = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const alignments = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const defaultElement = {
  "display-2xl": "h1",
  "display-xl": "h1",
  "display-lg": "h1",
  "display-md": "h2",
  "display-sm": "h2",
  "display-xs": "h3",
  "h1": "h1",
  "h2": "h2",
  "h3": "h3",
  "h4": "h4",
  "h5": "h5",
  "h6": "h6",
  "body-lg": "p",
  "body-base": "p",
  "body-sm": "p",
  "body-xs": "p",
  "caption": "span",
} as const;

export function Typography<T extends ElementType = "p">({
  as,
  children,
  className,
  variant = "body-base",
  color = "secondary",
  weight = "normal",
  align = "left",
}: TypographyProps<T>) {
  const Component = as || defaultElement[variant] || "p";

  return (
    <Component
      className={clsx(
        variants[variant],
        colors[color],
        weights[weight],
        alignments[align],
        className
      )}
    >
      {children}
    </Component>
  );
} 