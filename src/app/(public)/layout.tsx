import { Navigation } from "@/components/navigation";
import React from "react";
import { Footer } from "./page";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {" "}
      <Navigation />
      <main className="flex-1">
        {children}
        <Footer />
      </main>
    </div>
  );
};

export default MainLayout;
