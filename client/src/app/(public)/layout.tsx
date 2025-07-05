import { Navigation } from "@/components/navigation";
import React from "react";
import { Footer } from "./page";
import { getCurrentUser } from "@/services/auth-services";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getCurrentUser();
  return (
    <div>
      {" "}
      <Navigation user={user} />
      <main className="flex-1">
        {children}
        <Footer />
      </main>
    </div>
  );
};

export default MainLayout;
