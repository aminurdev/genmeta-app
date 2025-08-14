import { Navigation } from "@/components/navigation";
import React from "react";
import { getCurrentUser } from "@/services/auth-services";
import { Footer } from "@/components/Home";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getCurrentUser();
  return (
    <div>
      <Navigation propUser={user} />
      <main className="flex-1">
        {children}
        <Footer />
      </main>
    </div>
  );
};

export default MainLayout;
