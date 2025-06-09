"use client";
import { useState } from "react";
import {
  LifeBuoy,
  LogOut,
  UserCircle,
  Loader2,
  Package,
  AppWindow,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/types/user";
import { logout } from "@/services/auth-services";

export function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    const result = await logout();
    setIsLoading(false);

    if (result.success) {
      if (pathname !== "/") {
        router.push("/login");
      }
    } else {
      console.error(result.message);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <UserCircle className="cursor-pointer" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {user && (
          <DropdownMenuLabel className="text-lg">{user.name}</DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link
              href="/dashboard"
              className="cursor-pointer flex items-center gap-2 w-full"
            >
              <UserCircle className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <a
              href="mailto:helpgenmeta@gmail.com"
              className="cursor-pointer flex items-center gap-2 w-full"
            >
              <LifeBuoy className="h-4 w-4" />
              <span>Support</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {user?.role === "admin" && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  href="/admin"
                  className="cursor-pointer flex items-center gap-2 w-full"
                >
                  <Package className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  href="/admin/app"
                  className="cursor-pointer flex items-center gap-2 w-full"
                >
                  <AppWindow className="h-4 w-4" />
                  <span>App Admin</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <Button
            className="h-6 p-1 flex items-center gap-1"
            variant={"ghost"}
            size={"sm"}
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 animate-spin" />
                <span>Logging out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4" />
                <span>Log out</span>
              </>
            )}
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
