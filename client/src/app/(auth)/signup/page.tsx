import SignUpForm from "@/components/auth/signup-form";
import { AuthShell } from "@/components/auth/auth-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | GenMeta",
  description: "Create your free GenMeta account.",
};

export default function SignUpPage() {
  return (
    <AuthShell mode="signup">
      <SignUpForm />
    </AuthShell>
  );
}
