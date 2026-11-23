import { Footer } from "@/components/Home";
import { Navigation } from "@/components/navigation";
import { getCurrentUser } from "@/services/auth-services";
import type React from "react";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <>
      <div className="print:hidden">
        <Navigation propUser={user} />
      </div>
      <main className="flex-1">{children}</main>
      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}
