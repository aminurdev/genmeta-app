"use client";

import { LogOut, User as UserIcon, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useSidebar } from "./ui/sidebar";
import { logout } from "@/services/auth-services";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";

interface Props {
  user?: User;
}

export function NavUser({ user }: Props) {
  const router = useRouter();
  const { state, isMobile } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isCollapsed = state === "collapsed";
  const userName = user?.name || "User";
  const userEmail = user?.email || "user@example.com";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push("/login");
    } else {
      console.error(result.message);
    }
  };

  // Collapsed view for desktop
  if (isCollapsed && !isMobile) {
    return (
      <TooltipProvider>
        <div className="flex flex-col items-center gap-2 p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu
                open={isDropdownOpen}
                onOpenChange={setIsDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-10 w-10 rounded-full p-0 transition-all duration-300 ease-in-out",
                      "hover:scale-110 hover:shadow-lg hover:ring-2 hover:ring-primary/20",
                      isDropdownOpen && "scale-105 ring-2 ring-primary/30"
                    )}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <Avatar
                      className={cn(
                        "h-8 w-8 transition-all duration-300 ease-in-out",
                        isHovered && "scale-110"
                      )}
                    >
                      <AvatarImage
                        src={user?.avatar || "/user/placeholder.svg"}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="end"
                  className="w-56 animate-in slide-in-from-left-2 duration-300"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/appearance"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="animate-in slide-in-from-left-2"
            >
              <div className="text-center">
                <p className="font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  // Expanded view
  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        "animate-in slide-in-from-bottom-2",
        isMobile && "p-2"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full h-auto p-3 justify-start transition-all duration-300 ease-in-out",
              "hover:bg-muted/50 hover:scale-[1.02] hover:shadow-sm",
              isDropdownOpen && "bg-muted/50 scale-[1.01]",
              isMobile && "rounded-lg"
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <Avatar
                className={cn(
                  "h-9 w-9 transition-all duration-300 ease-in-out",
                  isHovered && "scale-110 ring-2 ring-primary/20"
                )}
              >
                <AvatarImage src={user?.avatar || "/user/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium leading-none transition-all duration-300",
                    isHovered && "text-primary",
                    "truncate"
                  )}
                >
                  {userName}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {userEmail}
                </p>
              </div>
              <div
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  isDropdownOpen ? "rotate-180" : "rotate-0"
                )}
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isMobile ? "top" : "right"}
          align="end"
          className={cn(
            "w-56 animate-in duration-300",
            isMobile ? "slide-in-from-bottom-2" : "slide-in-from-left-2"
          )}
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 cursor-pointer"
            >
              <UserIcon className="h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/dashboard/appearance"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
