import Footer from "@/components/main/footer";
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
      <Navigation propUser={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
