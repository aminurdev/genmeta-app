"use client";

import type React from "react";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Coins,
  Mail,
  Shield,
  User,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ImageIcon,
  MoreHorizontal,
  Download,
  Ban,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { getBaseApi } from "@/services/image-services";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAccessToken } from "@/services/auth-services";

interface UserDetails {
  user: {
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    status: string;
    createdAt: string;
  };
  currentPlan?: {
    name: string;
    tokens: number;
    status: string;
    expiresDate: string;
  };
  tokens: {
    available: number;
    used: number;
    total: number;
  };
  images: {
    processed: number;
    total: number;
  };
}

interface ImageBatch {
  _id: string;
  userId: string;
  batchId: string;
  name: string;
  status: string;
  tokensUsed: number;
  imagesCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  _id: string;
  paymentID: string;
  status: string;
  amount: number;
  tokensAdded: number;
  createdAt: string;
  planDetails: {
    _id: string;
    title: string;
    tokens: number;
    price: number;
    discount: number;
    popular?: boolean;
    updatedAt: string;
  };
}

interface TokenHistory {
  _id: string;
  actionType: string;
  description: string;
  tokenDetails: {
    count: number;
    type: string;
  };
  batchId: string;
  createdAt: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export default function UserDetailsPage() {
  const params = useParams() as { id: string };
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [images, setImages] = useState<ImageBatch[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tokenHistory, setTokenHistory] = useState<TokenHistory[]>([]);
  const [imagePagination, setImagePagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 5,
  });
  const [paymentPagination, setPaymentPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 5,
  });
  const [tokenPagination, setTokenPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 5,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignTokensOpen, setAssignTokensOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeTab, setActiveTab] = useState("overview");

  const fetchImages = useCallback(
    async (page = 1) => {
      try {
        const baseApi = await getBaseApi();
        const accessToken = await getAccessToken();

        const response = await fetch(
          `${baseApi}/admin/users/images/${params.id}?page=${page}&limit=5`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const data = await response.json();
        if (data.success) {
          setImages(data.data.images);
          setImagePagination(data.data.pagination);
        }
      } catch (err) {
        console.error("Error fetching images:", err);
      }
    },
    [params.id]
  );

  const fetchPayments = useCallback(
    async (page = 1) => {
      try {
        const baseApi = await getBaseApi();
        const accessToken = await getAccessToken();

        const response = await fetch(
          `${baseApi}/admin/users/payments/${params.id}?page=${page}&limit=5`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const data = await response.json();
        if (data.success) {
          setPayments(data.data.payments);
          setPaymentPagination(data.data.pagination);
        }
      } catch (err) {
        console.error("Error fetching payments:", err);
      }
    },
    [params.id]
  );

  const fetchTokenHistory = useCallback(
    async (page = 1) => {
      try {
        const baseApi = await getBaseApi();
        const accessToken = await getAccessToken();

        const response = await fetch(
          `${baseApi}/admin/users/tokens/${params.id}?page=${page}&limit=5`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const data = await response.json();
        if (data.success) {
          setTokenHistory(data.data.tokenHistory);
          setTokenPagination(data.data.pagination);
        }
      } catch (err) {
        console.error("Error fetching token history:", err);
      }
    },
    [params.id]
  );

  const assignTokens = async (tokens: number, reason: string) => {
    try {
      setIsAssigning(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${baseApi}/admin/users/tokens/assign/${params.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            tokens,
            reason,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Tokens assigned successfully");
        // Update user details and token history
        fetchData();
        setAssignTokensOpen(false);
      } else {
        throw new Error(data.message || "Failed to assign tokens");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to assign tokens"
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignTokens = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const tokens = Number.parseInt(formData.get("tokens") as string);
    const reason = formData.get("reason") as string;

    if (isNaN(tokens) || tokens <= 0) {
      toast.error("Please enter a valid number of tokens");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please enter a reason for token assignment");
      return;
    }

    assignTokens(tokens, reason);
  };

  const fetchData = useCallback(async () => {
    if (!params?.id) {
      setError("User ID not found");
      setLoading(false);
      return;
    }

    try {
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      // Fetch user details
      const userResponse = await fetch(
        `${baseApi}/admin/users/details/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const userData = await userResponse.json();

      if (userData.success) {
        setUserDetails(userData.data);
      }

      // Fetch initial data for all sections
      await Promise.all([fetchImages(), fetchPayments(), fetchTokenHistory()]);
    } catch (err) {
      setError("An error occurred while fetching data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [params?.id, fetchImages, fetchPayments, fetchTokenHistory]);

  useEffect(() => {
    fetchData();
  }, [params.id, fetchData]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "suspended":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "user":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTokenActionColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "added":
        return "bg-green-100 text-green-700 border-green-200";
      case "used":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void
  ) => {
    const getVisiblePages = () => {
      const delta = 1; // Number of pages to show before and after current page
      const pages = [];

      for (let i = 1; i <= totalPages; i++) {
        if (
          i === 1 || // First page
          i === totalPages || // Last page
          (i >= currentPage - delta && i <= currentPage + delta) // Pages around current
        ) {
          pages.push(i);
        }
      }

      // Add ellipsis indicators
      const withEllipsis = [];
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          if (pages[i] - pages[i - 1] > 1) {
            withEllipsis.push("ellipsis");
          }
        }
        withEllipsis.push(pages[i]);
      }

      return withEllipsis;
    };

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              className={
                currentPage === 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
              aria-disabled={currentPage === 1}
            />
          </PaginationItem>

          {getVisiblePages().map((page, index) => (
            <PaginationItem key={index}>
              {page === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => onPageChange(page as number)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
              aria-disabled={currentPage === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-[250px]" />
            <Skeleton className="h-4 w-[180px]" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-[140px]" />
                <Skeleton className="h-4 w-[200px]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mt-6">
          <CardHeader>
            <Skeleton className="h-5 w-[180px]" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-2">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <CardTitle className="text-2xl font-bold text-red-500">
              Error Loading User Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/admin/users">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!userDetails) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-4 md:p-8 animate-in fade-in duration-300">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to users</span>
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border shadow-sm">
              <AvatarImage
                src={`https://avatar.vercel.sh/${userDetails.user.email}`}
                alt={userDetails.user.name}
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {userDetails.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{userDetails.user.name}</h1>
                <Badge
                  variant="outline"
                  className={`capitalize ${getRoleColor(
                    userDetails.user.role
                  )}`}
                >
                  {userDetails.user.role}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${getStatusColor(userDetails.user.status)}`}
                >
                  {userDetails.user.status}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {userDetails.user.email}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Dialog open={assignTokensOpen} onOpenChange={setAssignTokensOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Assign Tokens
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAssignTokens}>
                <DialogHeader>
                  <DialogTitle>Assign Tokens</DialogTitle>
                  <DialogDescription>
                    Add tokens to the user&apos;s account. This action cannot be
                    undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tokens">Number of Tokens</Label>
                    <Input
                      id="tokens"
                      name="tokens"
                      type="number"
                      placeholder="Enter number of tokens"
                      min="1"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      name="reason"
                      placeholder="Enter reason for token assignment"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAssignTokensOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isAssigning}>
                    {isAssigning ? "Assigning..." : "Assign Tokens"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>User Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserCog className="h-4 w-4 mr-2" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Ban className="h-4 w-4 mr-2" />
                Suspend Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Tabs
        defaultValue="overview"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="space-y-6 animate-in fade-in-50 duration-300"
        >
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  User Information
                </CardTitle>
                <CardDescription>Basic details about the user</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Role:</span>
                  <Badge
                    variant="outline"
                    className={`capitalize ${getRoleColor(
                      userDetails.user.role
                    )}`}
                  >
                    {userDetails.user.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(userDetails.user.status)}`}
                  >
                    {userDetails.user.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {userDetails.user.isVerified ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="font-medium">Verification:</span>
                  <span>
                    {userDetails.user.isVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Joined:</span>
                  <span>
                    {format(
                      new Date(userDetails.user.createdAt),
                      "MMM d, yyyy"
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Current Plan
                </CardTitle>
                <CardDescription>Subscription and plan details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium">Plan Name:</span>
                  <p className="text-muted-foreground">
                    {userDetails?.currentPlan?.name}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <p className="text-muted-foreground">
                    {userDetails?.currentPlan?.status}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Expires:</span>
                  <p className="text-muted-foreground">
                    {format(
                      new Date(userDetails?.currentPlan?.expiresDate || 0),
                      "MMM d, yyyy"
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Token Usage
                </CardTitle>
                <CardDescription>Token consumption statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Available:</span>
                  </div>
                  <span className="font-semibold">
                    {userDetails.tokens.available}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Used:</span>
                  </div>
                  <span>{userDetails.tokens.used}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Total:</span>
                  </div>
                  <span>{userDetails.tokens.total}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span>Usage</span>
                    <span>
                      {Math.round(
                        (userDetails.tokens.used / userDetails.tokens.total) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      (userDetails.tokens.used / userDetails.tokens.total) * 100
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Image Processing
                </CardTitle>
                <CardDescription>Image processing statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Processed:</span>
                  </div>
                  <span>{userDetails.images.processed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Total:</span>
                  </div>
                  <span>{userDetails.images.total}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span>Completion</span>
                    <span>
                      {Math.round(
                        (userDetails.images.processed /
                          userDetails.images.total) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      (userDetails.images.processed /
                        userDetails.images.total) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Recent Image Batches
                </CardTitle>
                <CardDescription>
                  Latest image processing batches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Images</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {images.length > 0 ? (
                        images.slice(0, 3).map((batch) => (
                          <TableRow key={batch._id}>
                            <TableCell className="font-medium">
                              {batch.name}
                            </TableCell>
                            <TableCell>
                              {format(new Date(batch.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  batch.status === "Completed"
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-yellow-100 text-yellow-700 border-yellow-200"
                                }
                              >
                                {batch.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {batch.imagesCount}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-6 text-muted-foreground"
                          >
                            No image batches found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {images.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("images")}
                      className="text-sm"
                    >
                      View all batches
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Recent Token History
                </CardTitle>
                <CardDescription>Latest token transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tokenHistory.length > 0 ? (
                        tokenHistory.slice(0, 3).map((history) => (
                          <TableRow key={history._id}>
                            <TableCell className="font-medium">
                              {history.description}
                            </TableCell>
                            <TableCell>
                              {format(
                                new Date(history.createdAt),
                                "MMM d, yyyy"
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={`font-medium ${
                                  history.tokenDetails.type.toLowerCase() ===
                                  "added"
                                    ? "text-green-600"
                                    : "text-blue-600"
                                }`}
                              >
                                {history.tokenDetails.type.toLowerCase() ===
                                "added"
                                  ? "+"
                                  : "-"}
                                {history.tokenDetails.count}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-6 text-muted-foreground"
                          >
                            No token history found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {tokenHistory.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("tokens")}
                      className="text-sm"
                    >
                      View all transactions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent
          value="images"
          className="animate-in fade-in-50 duration-300"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Image Batches
              </CardTitle>
              <CardDescription>All image processing batches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tokens Used</TableHead>
                      <TableHead className="text-right">Images</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {images.length > 0 ? (
                      images.map((batch) => (
                        <TableRow key={batch._id}>
                          <TableCell className="font-medium">
                            {batch.name}
                          </TableCell>
                          <TableCell>
                            {format(new Date(batch.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                batch.status === "Completed"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
                              }
                            >
                              {batch.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{batch.tokensUsed}</TableCell>
                          <TableCell className="text-right">
                            {batch.imagesCount}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No image batches found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {images.length} of {imagePagination.totalItems}{" "}
                  batches
                </p>
                {renderPagination(
                  imagePagination.currentPage,
                  imagePagination.totalPages,
                  fetchImages
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="payments"
          className="animate-in fade-in-50 duration-300"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Payment History
              </CardTitle>
              <CardDescription>All payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tokens Added</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length > 0 ? (
                      payments.map((payment) => (
                        <TableRow key={payment._id}>
                          <TableCell className="font-medium">
                            {payment.planDetails.title}
                          </TableCell>
                          <TableCell>
                            {format(new Date(payment.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                payment.status === "Completed"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : payment.status === "Failed"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : payment.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{payment.tokensAdded}</TableCell>
                          <TableCell className="text-right font-medium">
                            ${payment.amount}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No payment history found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {payments.length} of {paymentPagination.totalItems}{" "}
                  payments
                </p>
                {renderPagination(
                  paymentPagination.currentPage,
                  paymentPagination.totalPages,
                  fetchPayments
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="tokens"
          className="animate-in fade-in-50 duration-300"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Token History
              </CardTitle>
              <CardDescription>All token transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokenHistory.length > 0 ? (
                      tokenHistory.map((history) => (
                        <TableRow key={history._id}>
                          <TableCell className="font-medium">
                            {history.description}
                          </TableCell>
                          <TableCell>
                            {format(new Date(history.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getTokenActionColor(
                                history.tokenDetails.type
                              )}
                            >
                              {history.tokenDetails.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`font-medium ${
                                history.tokenDetails.type.toLowerCase() ===
                                "added"
                                  ? "text-green-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {history.tokenDetails.type.toLowerCase() ===
                              "added"
                                ? "+"
                                : "-"}
                              {history.tokenDetails.count}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No token history found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {tokenHistory.length} of {tokenPagination.totalItems}{" "}
                  records
                </p>
                {renderPagination(
                  tokenPagination.currentPage,
                  tokenPagination.totalPages,
                  fetchTokenHistory
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
