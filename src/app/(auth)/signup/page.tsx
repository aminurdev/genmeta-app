import Navbar from "@/components/auth/navbar";
import SignUpForm from "@/components/auth/signup-form";
import Image from "next/image";
import React from "react";
const SignUp = () => {
  return (
    <div className="grid grid-cols-5 min-h-screen">
      <div className="col-span-5 md:col-span-3">
        <Navbar />
        <div className="flex justify-center items-center">
          <SignUpForm />
        </div>
      </div>
      <div className="col-span-2 bg-accent/50 hidden md:flex items-center justify-center gap-3 ">
        <div className="w-4/5">
          <Image
            src="/assets/auth/connections_platform_product.png"
            alt="product"
            height={800}
            width={800}
          />
        </div>
      </div>
    </div>
  );
};

export default SignUp;
