import LoginForm from "@/components/auth/login-form";
import Navbar from "@/components/auth/navbar";
import React from "react";
const Login = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex justify-center items-center mb-5">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
