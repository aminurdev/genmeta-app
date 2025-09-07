"use client";
import {
  LogOut,
  UserCircle,
  Loader2,
  Package,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";

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

export function UserMenu({
  user,
  isLoading,
  handleLogout,
}: {
  user: User;
  isLoading: boolean;
  handleLogout: () => void;
}) {
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
              className="cursor-pointer flex items-center gap-2 w-full py-2"
            >
              <UserCircle className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <a
              href="https://wa.me/+8801817710493"
              className="cursor-pointer flex items-center gap-2 w-full py-2"
              target="_blank"
              rel="noreferrer"
            >
              <Phone className="h-4 w-4" />
              <span>Whatsapp</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <a
              href="mailto:support@genmeta.app"
              className="cursor-pointer flex items-center gap-2 w-full py-2"
              target="_blank"
              rel="noreferrer"
            >
              <Mail className="h-4 w-4" />
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
                  className="cursor-pointer flex items-center gap-2 w-full py-2"
                >
                  <Package className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <Button
            className="h-6 p-1 flex items-center gap-1 py-2"
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
