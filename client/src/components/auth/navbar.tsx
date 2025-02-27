import React from "react";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import Link from "next/link";

const navbar = () => {
  return (
    <div>
      <MaxWidthWrapper className="px-5 md:px-16">
        <nav className="w-full py-8 flex justify-between items-center">
          <Link href="/" className="font-semibold text-3xl">
            Gen-Meta-Ai
          </Link>
        </nav>
      </MaxWidthWrapper>
    </div>
  );
};

export default navbar;
