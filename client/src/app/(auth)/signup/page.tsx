import Navbar from "@/components/auth/navbar";
import SignUpForm from "@/components/auth/signup-form";

import React from "react";
const SignUp = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex justify-center items-center mb-5">
        <SignUpForm />
      </div>
    </div>
  );
};

export default SignUp;
