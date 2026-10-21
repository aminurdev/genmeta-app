import EmailVerification from "@/components/auth/email-verification";
import { AuthShell } from "@/components/auth/auth-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | GenMeta",
  description: "Reset your GenMeta account password.",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell mode="reset">
      <EmailVerification />
    </AuthShell>
  );
}
