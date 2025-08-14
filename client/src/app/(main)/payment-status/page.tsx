import { CheckCircle, ArrowLeft, Laptop } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export default async function PaymentStatus({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string;
    amount?: string;
    plan?: string;
    status?: string;
  }>;
}) {
  const { message, amount, plan, status } = await searchParams;

  const getStatusConfig = () => {
    return {
      title: "Payment Successful",
      description: message || "Your payment has been successfully.",
      icon: <CheckCircle className="h-16 w-16 text-green-500" />,
      color: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
    };
  };

  const { title, description, icon, color, borderColor } = getStatusConfig();

  return (
    <div className="mt-10 flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <Card
        className={`w-full max-w-md border-2 shadow-lg ${borderColor} ${color}`}
      >
        <CardHeader className="flex flex-col items-center gap-4 pt-8">
          <div className="rounded-full p-2 bg-white dark:bg-gray-900 shadow-sm">
            {icon}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {description}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {status === "success" && amount && plan && (
            <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 dark:text-gray-400">
                  Amount Paid:
                </span>
                <span className="font-medium">{amount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Plan Activated:
                </span>
                <span className="font-medium capitalize">{plan}</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pb-8 gap-4">
          <Button asChild className="gap-2">
            <Link href="/" aria-label="Go to Home">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/download" aria-label="Get the App">
              <Laptop className="h-4 w-4" />
              Get App
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
