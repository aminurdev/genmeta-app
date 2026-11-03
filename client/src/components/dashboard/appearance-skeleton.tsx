import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Laptop } from "lucide-react";

export function AppearanceSkeleton() {
  return (
    <div className="space-y-6 p-4 pt-0 animate-in fade-in-50 duration-200">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the appearance of the application. Choose between light and dark mode.
        </p>
      </div>
      <Separator />

      <div className="space-y-8 max-w-5xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Light Theme Option Skeleton */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-white p-6 flex flex-col items-center gap-2">
                <Sun className="h-8 w-8 text-amber-500" />
                <div className="font-medium text-black">Light</div>
                <div className="text-xs text-gray-500">
                  Light mode appearance
                </div>
              </div>
              <div className="bg-gray-100 p-4 flex flex-col gap-2">
                <div className="h-2 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-2 w-1/2 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>

          {/* Dark Theme Option Skeleton */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gray-950 p-6 flex flex-col items-center gap-2">
                <Moon className="h-8 w-8 text-blue-400" />
                <div className="font-medium text-white">Dark</div>
                <div className="text-xs text-gray-400">
                  Dark mode appearance
                </div>
              </div>
              <div className="bg-gray-900 p-4 flex flex-col gap-2">
                <div className="h-2 w-3/4 bg-gray-800 rounded animate-pulse" />
                <div className="h-2 w-1/2 bg-gray-800 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>

          {/* System Theme Option Skeleton */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-white to-gray-950 p-6 flex flex-col items-center gap-2">
                <Laptop className="h-8 w-8 text-purple-500" />
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  System
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Follow system preference
                </div>
              </div>
              <div className="bg-gradient-to-r from-gray-100 to-gray-900 p-4 flex flex-col gap-2">
                <div className="h-2 w-3/4 bg-gradient-to-r from-gray-200 to-gray-800 rounded animate-pulse" />
                <div className="h-2 w-1/2 bg-gradient-to-r from-gray-200 to-gray-800 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AppearanceSkeleton;

