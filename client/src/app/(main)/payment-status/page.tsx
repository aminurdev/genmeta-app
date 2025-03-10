import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";
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
    status?: string;
    message?: string;
    amount?: string;
    tokens?: string;
  }>;
}) {
  const { status, message, amount, tokens } = await searchParams;

  console.log(status);

  const getStatusConfig = () => {
    switch (status) {
      case "success":
        return {
          title: "Payment Successful",
          description:
            message || "Your payment has been processed successfully.",
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          color: "bg-green-50 dark:bg-green-950/30",
          borderColor: "border-green-200 dark:border-green-800",
        };
      case "error":
        return {
          title: "Payment Error",
          description: message || "There was an error processing your payment.",
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          color: "bg-red-50 dark:bg-red-950/30",
          borderColor: "border-red-200 dark:border-red-800",
        };
      case "failed":
        return {
          title: "Payment Failed",
          description: message || "Your payment could not be processed.",
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          color: "bg-red-50 dark:bg-red-950/30",
          borderColor: "border-red-200 dark:border-red-800",
        };
      case "cancelled":
        return {
          title: "Payment Cancelled",
          description: message || "Your payment was cancelled.",
          icon: <AlertTriangle className="h-16 w-16 text-amber-500" />,
          color: "bg-amber-50 dark:bg-amber-950/30",
          borderColor: "border-amber-200 dark:border-amber-800",
        };
      case "unknown":
      default:
        return {
          title: "Payment Status Unknown",
          description:
            message || "We couldn't determine the status of your payment.",
          icon: <HelpCircle className="h-16 w-16 text-gray-500" />,
          color: "bg-gray-50 dark:bg-gray-900/50",
          borderColor: "border-gray-200 dark:border-gray-800",
        };
    }
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
          {status === "success" && amount && tokens && (
            <div className=" rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 dark:text-gray-400">
                  Amount Paid:
                </span>
                <span className="font-medium">{amount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Tokens Added:
                </span>
                <span className="font-medium">{tokens}</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pb-8">
          <Button asChild className="gap-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
