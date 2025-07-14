"use client";

import { useTheme } from "next-themes";
import Image from "next/image";

export const Banner = () => {
  const { theme } = useTheme();
  return (
    <div className="mt-16 relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur-sm opacity-50"></div>
      <div className="relative bg-card rounded-xl overflow-hidden shadow-2xl border border-violet-200 dark:border-violet-800">
        <Image
          src={
            theme === "dark" ? "/Assets/app-dark.png" : "/Assets/app-light.png"
          }
          alt="GenMeta App Preview"
          width={2000}
          height={1200}
          className="w-full h-auto"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-20 dark:hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    </div>
  );
};
