import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Receipt, DollarSign } from "lucide-react";

interface Payment {
  id: string;
  trxID: string;
  plan: {
    id: string;
    type: string;
  };
  amount: number;
  createdAt: string;
}

interface PaymentsTableProps {
  payments: Payment[];
  totalSpent: number;
}

export function PaymentsTable({ payments, totalSpent }: PaymentsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "h:mm a");
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Recent Payments
        </CardTitle>
        <CardDescription>Your latest payment transactions</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-muted-foreground">
              No payments yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Your payment history will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{payment.trxID}</span>
                        <span className="text-xs text-muted-foreground md:hidden">
                          {formatDate(payment.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {payment.plan.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(payment.createdAt)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatTime(payment.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {payments.length > 0 && (
        <CardFooter className="flex justify-between items-center border-t px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            Total spent:{" "}
            <span className="font-medium">{formatCurrency(totalSpent)}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {payments.length} transactions
          </Badge>
        </CardFooter>
      )}
    </Card>
  );
}
