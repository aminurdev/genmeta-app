import React from "react";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import Link from "next/link";
import Image from "next/image";

const navbar = () => {
  return (
    <div>
      <MaxWidthWrapper className="px-5 md:px-16">
        <nav className="w-full py-8 flex justify-between items-center">
          <Link href="/" className="block w-52">
            <Image
              src="/Assets/SVG/Asset 5.svg"
              className="h-16 py-2 w-auto"
              alt="logo"
              width={128}
              height={128}
            />
          </Link>
        </nav>
      </MaxWidthWrapper>
    </div>
  );
};

export default navbar;
