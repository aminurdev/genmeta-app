import { Navigation } from "@/components/navigation";
import React from "react";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {" "}
      <Navigation />
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default MainLayout;
