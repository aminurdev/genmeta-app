"use client";

import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { logout } from "@/services/auth-services";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";

interface Props {
  user?: User;
}

export function NavUser({ user }: Props) {
  const router = useRouter();
  const handleLogout = async () => {
    const result = await logout();

    if (result.success) {
      router.push("/login");
    } else {
      console.error(result.message);
    }
  };
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src="/user/placeholder.svg" />
          <AvatarFallback>AD</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{user ? user.name : "User"}</p>
          <p className="text-xs text-muted-foreground">
            {user ? user.email : "uer@example.com"}
          </p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="rounded-full p-2 hover:bg-muted"
      >
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Log out</span>
      </button>
    </div>
  );
}
