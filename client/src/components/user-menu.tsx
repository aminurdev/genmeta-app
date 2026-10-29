"use client";

import Link from "next/link";
import {
  ChevronDown,
  LayoutDashboard,
  User as UserIcon,
  Sparkles,
  Gift,
  Shield,
  ShieldAlert,
  BookOpen,
  Palette,
  LifeBuoy,
  LogOut,
  Loader2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";

interface UserMenuProps {
  user: User;
  isLoading: boolean;
  handleLogout: () => void;
  className?: string;
}

export function UserMenu({
  user,
  isLoading,
  handleLogout,
  className,
}: UserMenuProps) {
  if (!user) return null;

  const firstName = user.name?.trim().split(/\s+/)[0] || "Account";
  const userInitials = (user.name || "U")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const renderRoleBadge = () => {
    if (user.role === "superAdmin") {
      return (
        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
          Super Admin
        </span>
      );
    }
    if (user.role === "admin") {
      return (
        <span className="inline-flex items-center rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border">
        Member
      </span>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex h-8 items-center gap-2 rounded-full border border-border/70 bg-background/80 pl-1 pr-2.5 text-left text-xs font-medium transition-all hover:bg-accent/60 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
            className
          )}
          aria-label="Open user menu"
        >
          <Avatar className="h-6 w-6 border border-border/60">
            <AvatarImage
              src={user.avatar || undefined}
              alt={user.name || "User"}
            />
            <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline-block max-w-[100px] truncate text-foreground font-medium">
            {firstName}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground/70 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 sm:w-72 rounded-xl p-1.5 shadow-xl border-border/80 backdrop-blur-sm"
        align="end"
        sideOffset={8}
      >
        {/* User profile card */}
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 mb-1">
          <Avatar className="h-10 w-10 border border-border/80 shrink-0">
            <AvatarImage
              src={user.avatar || undefined}
              alt={user.name || "User"}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-sm truncate text-foreground">
              {user.name}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {user.email}
            </span>
            <div className="mt-1">{renderRoleBadge()}</div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Workspace navigation */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 py-2 px-2.5 rounded-md"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Dashboard</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 py-2 px-2.5 rounded-md"
            >
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Profile & API Key</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href="/pricing"
              className="flex items-center justify-between py-2 px-2.5 rounded-md w-full"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-sm">Plans & Credits</span>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Upgrade
              </span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href="/dashboard/referral"
              className="flex items-center justify-between py-2 px-2.5 rounded-md w-full"
            >
              <div className="flex items-center gap-2.5">
                <Gift className="h-4 w-4 text-purple-500" />
                <span className="font-medium text-sm">Refer & Earn</span>
              </div>
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                20%
              </span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* Admin management section */}
        {(user.role === "admin" || user.role === "superAdmin") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-2.5 py-1">
              Administration
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link
                  href="/admin"
                  className="flex items-center gap-2.5 py-2 px-2.5 rounded-md"
                >
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">Admin Console</span>
                </Link>
              </DropdownMenuItem>
              {user.role === "superAdmin" && (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link
                    href="/admin/super-admin"
                    className="flex items-center gap-2.5 py-2 px-2.5 rounded-md"
                  >
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-sm">Super Admin Hub</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </>
        )}

        {/* Preferences & Help */}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href="/docs"
              className="flex items-center gap-2.5 py-2 px-2.5 rounded-md"
            >
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Documentation</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href="/dashboard/appearance"
              className="flex items-center gap-2.5 py-2 px-2.5 rounded-md"
            >
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Appearance</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href="/contact"
              className="flex items-center gap-2.5 py-2 px-2.5 rounded-md"
            >
              <LifeBuoy className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Help & Support</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* Sign out */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive py-2 px-2.5 rounded-md gap-2.5 font-medium text-sm"
          onSelect={(e) => {
            e.preventDefault();
            handleLogout();
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-destructive" />
              <span>Logging out...</span>
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4 text-destructive" />
              <span>Log out</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
