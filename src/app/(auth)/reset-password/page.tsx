import EmailVerification from "@/components/auth/email-verification";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto p-6 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <EmailVerification />
    </Suspense>
  );
}
