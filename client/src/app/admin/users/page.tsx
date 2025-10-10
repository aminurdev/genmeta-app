"use client";

import { useState, useEffect } from "react";
import {
  ArrowUpDown,
  Download,
  MoreHorizontal,
  Search,
  UserPlus,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Coins,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useUsers } from "@/hooks/use-users";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { toast } from "sonner";
import { getAccessToken, getBaseApi } from "@/services/auth-services";
import PaginationView from "@/components/pagination-view";
import { getUserStats, type UserStats } from "@/services/admin-dashboard";
import { UserStatsCards } from "@/components/admin/user-stats-cards";
import { LoginProviderStats } from "@/components/admin/login-provider-stats";

export default function UsersPage() {
  const { users, loading, error, pagination, fetchUsers } = useUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [stats, setStats] = useState<UserStats["data"]>({
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    recentRegistrations: 0,
    roleDistribution: [
      { _id: "user", count: 0 },
      { _id: "admin", count: 0 },
    ],
    loginProviders: [
      { _id: "google", count: 0 },
      { _id: "email", count: 0 },
    ],
    appUsers: {
      count: 0,
      percentage: 0,
    },
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getUserStats();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    };

    fetchStats();
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchUsers({
      page: 1,
      search: value,
      role: roleFilter === "all" ? undefined : roleFilter,
    });
  };

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
    fetchUsers({
      page: 1,
      search: searchTerm,
      role: value === "all" ? undefined : value,
    });
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    fetchUsers({
      page: 1,
      search: searchTerm,
      role: roleFilter === "all" ? undefined : roleFilter,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUsers({
      page,
      search: searchTerm,
      role: roleFilter === "all" ? undefined : roleFilter,
    });
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchUsers({
      page: currentPage,
      search: searchTerm,
      role: roleFilter === "all" ? undefined : roleFilter,
    });

    try {
      const data = await getUserStats();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error refreshing statistics:", error);
    }

    setIsRefreshing(false);
  };

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified ? (
      <Badge variant="outline" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Verified
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <XCircle className="h-3 w-3" />
        Unverified
      </Badge>
    );
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${baseApi}/admin/users/delete/${userToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success("User and all associated data deleted successfully");
        await fetchUsers({
          page: currentPage,
          search: searchTerm,
          role: roleFilter === "all" ? undefined : roleFilter,
        });
      } else {
        toast.error(data.message || "Failed to delete user");
      }
    } catch {
      toast.error("An error occurred while deleting the user");
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-destructive">
              Error Loading Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">{error.message}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => fetchUsers()}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-6 p-4 lg:p-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              User Management
            </h2>
            <p className="text-muted-foreground">
              Manage and monitor your platform users
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={refreshData}
                    disabled={isRefreshing}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Add User</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account and assign roles.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input id="name" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input id="email" type="email" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Role
                    </Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-6">
          <UserStatsCards stats={stats} />
          <LoginProviderStats stats={stats} />
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Users</CardTitle>
                <CardDescription>
                  Manage your platform users, their roles, and permissions.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Export Users</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="relative flex-1 lg:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={roleFilter} onValueChange={handleRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={statusFilter}
                    onValueChange={handleStatusFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  {(searchTerm ||
                    roleFilter !== "all" ||
                    statusFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setRoleFilter("all");
                        setStatusFilter("all");
                        fetchUsers();
                      }}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
              {(searchTerm ||
                roleFilter !== "all" ||
                statusFilter !== "all") && (
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {searchTerm}
                      <XCircle
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setSearchTerm("");
                          fetchUsers({
                            page: 1,
                            role: roleFilter === "all" ? undefined : roleFilter,
                          });
                        }}
                      />
                    </Badge>
                  )}
                  {roleFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Role: {roleFilter}
                      <XCircle
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setRoleFilter("all");
                          fetchUsers({
                            page: 1,
                            search: searchTerm,
                          });
                        }}
                      />
                    </Badge>
                  )}
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {statusFilter}
                      <XCircle
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setStatusFilter("all");
                          fetchUsers({
                            page: 1,
                            search: searchTerm,
                            role: roleFilter === "all" ? undefined : roleFilter,
                          });
                        }}
                      />
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Avatar</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        User
                        <Button variant="ghost" size="sm" className="h-8 p-0">
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-9 w-9 rounded-full" />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-[140px]" />
                              <Skeleton className="h-3 w-[180px]" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[60px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[70px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[70px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-[90px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.email}>
                        <TableCell>
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={`https://avatar.vercel.sh/${user.email}`}
                              alt={user.name}
                            />
                            <AvatarFallback>
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getVerificationBadge(user.isVerified)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{user.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {user.currentPlan?.name ??
                              user.metadata?.hasActiveKey?.type ??
                              "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">
                              {user.usage.totalProcess}
                            </span>
                            <span className="text-muted-foreground">
                              /{user.usage.credit}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(user.createdAt), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-[160px]"
                            >
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/users/${user._id}`}
                                  className="cursor-pointer"
                                >
                                  View details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer"
                                onClick={() =>
                                  setUserToDelete({
                                    id: user._id,
                                    name: user.name,
                                  })
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete user
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="h-10 w-10 text-muted-foreground" />
                          <div>
                            <p className="font-medium">No users found</p>
                            <p className="text-sm text-muted-foreground">
                              Try adjusting your filters
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchTerm("");
                              setRoleFilter("all");
                              setStatusFilter("all");
                              fetchUsers();
                            }}
                          >
                            Reset filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing <strong>{users.length}</strong> of{" "}
                <strong>{pagination.totalUsers}</strong> users
              </div>
              <PaginationView
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                paginationItemsToDisplay={5}
                handlePageChange={handlePageChange}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{userToDelete?.name}</span>? This
              will permanently delete:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>User account and profile</li>
              <li>All associated images and data</li>
              <li>Usage history and statistics</li>
            </ul>
            <p className="text-sm text-destructive font-medium">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setUserToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
