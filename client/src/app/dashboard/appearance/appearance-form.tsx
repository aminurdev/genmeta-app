"use client";

import { useTheme } from "next-themes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Moon, Sun, Laptop } from "lucide-react";

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();

  // Handle theme change - apply immediately
  const handleThemeChange = (value: string) => {
    setTheme(value);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <RadioGroup
        value={theme}
        onValueChange={handleThemeChange}
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        {/* Light Theme Option */}
        <div>
          <RadioGroupItem value="light" id="light" className="sr-only" />
          <Label htmlFor="light" className="cursor-pointer">
            <Card
              className={`overflow-hidden transition-colors ${
                theme === "light" ? "border-2 border-primary" : ""
              }`}
            >
              <CardContent className="p-0">
                <div className="bg-white p-6 flex flex-col items-center gap-2">
                  <Sun className="h-8 w-8 text-amber-500" />
                  <div className="font-medium text-black">Light</div>
                  <div className="text-xs text-gray-500">
                    Light mode appearance
                  </div>
                </div>
                <div className="bg-gray-100 p-4 flex flex-col gap-2">
                  <div className="h-2 w-3/4 bg-gray-200 rounded" />
                  <div className="h-2 w-1/2 bg-gray-200 rounded" />
                </div>
              </CardContent>
            </Card>
          </Label>
        </div>

        {/* Dark Theme Option */}
        <div>
          <RadioGroupItem value="dark" id="dark" className="sr-only" />
          <Label htmlFor="dark" className="cursor-pointer">
            <Card
              className={`overflow-hidden transition-colors ${
                theme === "dark" ? "border-2 border-primary" : ""
              }`}
            >
              <CardContent className="p-0">
                <div className="bg-gray-950 p-6 flex flex-col items-center gap-2">
                  <Moon className="h-8 w-8 text-blue-400" />
                  <div className="font-medium text-white">Dark</div>
                  <div className="text-xs text-gray-400">
                    Dark mode appearance
                  </div>
                </div>
                <div className="bg-gray-900 p-4 flex flex-col gap-2">
                  <div className="h-2 w-3/4 bg-gray-800 rounded" />
                  <div className="h-2 w-1/2 bg-gray-800 rounded" />
                </div>
              </CardContent>
            </Card>
          </Label>
        </div>

        {/* System Theme Option */}
        <div>
          <RadioGroupItem value="system" id="system" className="sr-only" />
          <Label htmlFor="system" className="cursor-pointer">
            <Card
              className={`overflow-hidden transition-colors ${
                theme === "system" ? "border-2 border-primary" : ""
              }`}
            >
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
                  <div className="h-2 w-3/4 bg-gradient-to-r from-gray-200 to-gray-800 rounded" />
                  <div className="h-2 w-1/2 bg-gradient-to-r from-gray-200 to-gray-800 rounded" />
                </div>
              </CardContent>
            </Card>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
