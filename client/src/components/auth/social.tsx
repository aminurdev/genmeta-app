"use client";

import React from "react";
import { Button } from "../ui/button";
import Image from "next/image";

const Social = ({ apiBaseUrl }: { apiBaseUrl: string }) => {
  return (
    <div className="flex gap-4 mb-2">
      <Button variant="outline" type="submit" className="w-full" asChild>
        <a href={`${apiBaseUrl}/auth/google`}>
          <Image
            src="/assets/auth/google.svg"
            className="h-4 w-4 text-neutral-800 dark:text-neutral-300 mr-2"
            width={20}
            height={20}
            alt="google"
          />
          Continue with Google
        </a>
      </Button>
    </div>
  );
};

export default Social;
