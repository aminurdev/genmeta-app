"use client";

import Image from "next/image";

export const Banner = () => {
  return (
    <div className="mt-16 rounded-xl border bg-muted/50 p-1.5 md:p-2">
      <div className="overflow-hidden rounded-lg border bg-background">
        <Image
          src="/Assets/app-light.png"
          alt="GenMeta App Preview"
          width={2000}
          height={1200}
          className="h-auto w-full dark:hidden"
          priority
        />
        <Image
          src="/Assets/app-dark.png"
          alt="GenMeta App Preview"
          width={2000}
          height={1200}
          className="hidden h-auto w-full dark:block"
          priority
        />
      </div>
    </div>
  );
};
