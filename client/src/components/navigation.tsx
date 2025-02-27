"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  HomeIcon,
  PhotoIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  ArrowLeftOnRectangleIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

interface Notification {
  id: string;
  message: string;
  type: "success" | "warning" | "error";
  timestamp: string;
}

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  const mainMenuItems = [
    { path: "/", label: "Home", icon: HomeIcon },
    { path: "/generate", label: "Generate", icon: PhotoIcon },
    { path: "/help", label: "Help", icon: QuestionMarkCircleIcon },
  ];

  const userMenuItems = [
    { path: "/dashboard", label: "Dashboard", icon: ChartBarIcon },
    { path: "/settings", label: "Settings", icon: Cog6ToothIcon },
    { path: "/history", label: "History", icon: DocumentDuplicateIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-secondary-200 ">
      <div className="h-16 max-w-screen-xl mx-auto">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-secondary-900 hover:text-secondary-700"
          >
            <PhotoIcon className="h-8 w-8 text-primary-600" />
            <Typography variant="h4" as="span">
              Image Processor
            </Typography>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* Main Menu */}
            <div className="flex items-center gap-1">
              {mainMenuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "text-primary-600 bg-primary-50"
                      : "text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </div>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-secondary-500 hover:text-secondary-700 rounded-lg hover:bg-secondary-50"
                  >
                    <BellIcon className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-error-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-soft-lg border border-secondary-200 py-2">
                      <div className="px-4 py-2 border-b border-secondary-200">
                        <Typography variant="h6">Notifications</Typography>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Typography variant="body-sm" color="secondary">
                            No notifications
                          </Typography>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="px-4 py-3 hover:bg-secondary-50"
                          >
                            <Typography variant="body-sm">
                              {notification.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="secondary"
                              className="mt-1"
                            >
                              {notification.timestamp}
                            </Typography>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-secondary-700 hover:text-secondary-900 hover:bg-secondary-50"
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">{"userName"}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-soft-lg border border-secondary-200 py-2">
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.path}
                          href={item.path}
                          className="flex items-center gap-2 px-4 py-2 text-secondary-700 hover:text-secondary-900 hover:bg-secondary-50"
                        >
                          <item.icon className="h-5 w-5" />
                          <Typography variant="body-sm">
                            {item.label}
                          </Typography>
                        </Link>
                      ))}
                      <hr className="my-2 border-secondary-200" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-secondary-700 hover:text-secondary-900 hover:bg-secondary-50"
                      >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                        <Typography variant="body-sm">Logout</Typography>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.push("/login")}>
                  Login
                </Button>
                <Button onClick={() => router.push("/register")}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-secondary-500 hover:text-secondary-700 rounded-lg hover:bg-secondary-50"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            {isUserMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isUserMenuOpen && (
        <div className="md:hidden border-t border-secondary-200">
          <div className="py-4">
            <div className="space-y-4">
              {mainMenuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "text-primary-600 bg-primary-50"
                      : "text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  <hr className="border-secondary-200" />
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50"
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                  <hr className="border-secondary-200" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50"
                  >
                    <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/login")}
                  >
                    Login
                  </Button>
                  <Button onClick={() => router.push("/register")}>
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
