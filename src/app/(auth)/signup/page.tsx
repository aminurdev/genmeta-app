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
      <div className="col-span-2 bg-white hidden md:flex items-center justify-center">
        <div className="w-full h-full flex items-center justify-center">
          <Image
            src="/Assets/Genmeta-Signup-Cover.jpg"
            alt="product"
            width={1000}
            height={1000}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default SignUp;
