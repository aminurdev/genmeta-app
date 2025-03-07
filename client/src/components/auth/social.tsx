import React from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import { signIn } from "next-auth/react";

const Social = () => {
  return (
    <div className="flex gap-4 mb-2">
      <Button
        onClick={() => signIn("google")}
        variant="outline"
        type="submit"
        className="w-full cursor-pointer"
        asChild
      >
        <span>
          <Image
            src="/auth/google.svg"
            className="h-4 w-4 text-neutral-800 dark:text-neutral-300 mr-2"
            width={20}
            height={20}
            alt="google"
          />
          Continue with Google
        </span>
      </Button>
    </div>
  );
};

export default Social;
