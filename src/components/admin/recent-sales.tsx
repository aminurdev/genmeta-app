import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  _id: string;
  status: string;
  amount: number;
  name: string;
  email: string;
}

interface RecentSalesProps {
  transactions: Transaction[];
}

export function RecentSales({ transactions }: RecentSalesProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "failed":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-8">
      {transactions.map((transaction) => (
        <div key={transaction._id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={`https://avatar.vercel.sh/${transaction.email}`}
              alt={transaction.name}
            />
            <AvatarFallback>{getInitials(transaction.name)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {transaction.name}
            </p>
            <p className="text-sm text-muted-foreground">{transaction.email}</p>
          </div>
          <div className="ml-auto font-medium">
            <Badge
              variant="outline"
              className={getStatusColor(transaction.status)}
            >
              {transaction.status}
            </Badge>
          </div>
          <div className="ml-4 font-medium">
            +৳{transaction.amount.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
