import Footer from "@/components/main/footer";
import Header from "@/components/main/header";
import type React from "react";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
