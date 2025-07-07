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
import { getBaseApi } from "@/services/image-services";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { toast } from "sonner";
import { getAccessToken } from "@/services/auth-services";
import PaginationView from "@/components/pagination-view";
import { getUserStats, UserStats } from "@/services/admin-dashboard";
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
      // Add status filter to your API if supported
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

    // Refresh stats
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200";
      case "inactive":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "suspended":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "user":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified ? (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
      >
        <CheckCircle2 className="h-3 w-3" />
        Verified
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1"
      >
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
        // Refresh the users list
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
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-500">
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
    <div className="flex min-h-screen flex-col ">
      <div className="flex-1 space-y-6 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                  Add User
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

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Manage your platform users, their roles, and permissions.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Users
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="relative flex-1 md:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search users by name or email..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={roleFilter} onValueChange={handleRoleFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by role" />
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
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
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
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm("");
                          setRoleFilter("all");
                          setStatusFilter("all");
                          fetchUsers();
                        }}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset filters
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
                              role:
                                roleFilter === "all" ? undefined : roleFilter,
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
                              role:
                                roleFilter === "all" ? undefined : roleFilter,
                            });
                          }}
                        />
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[80px]">Avatar</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          User
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-8 p-0"
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Verify Status</TableHead>
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
                              <Skeleton className="h-8 w-8 rounded-full" />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[120px]" />
                                <Skeleton className="h-3 w-[160px]" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-[60px] rounded-full" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-[80px] rounded-full" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-[80px] rounded-full" />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[100px]" />
                                <Skeleton className="h-3 w-[80px]" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[80px]" />
                                <Skeleton className="h-3 w-[60px]" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-[80px]" />
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end">
                                <Skeleton className="h-8 w-8 rounded-full" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    ) : users.length > 0 ? (
                      users.map((user) => (
                        <TableRow
                          key={user.email}
                          className="hover:bg-muted/50"
                        >
                          <TableCell>
                            <Avatar className="h-9 w-9 border">
                              <AvatarImage
                                src={`https://avatar.vercel.sh/${user.email}`}
                                alt={user.name}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary">
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
                            <Badge
                              variant="outline"
                              className={`capitalize ${getRoleColor(
                                user.role
                              )}`}
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getVerificationBadge(user.isVerified)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(user.status)}`}
                            >
                              {user.status}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">
                                {user.currentPlan?.name ??
                                  user.metadata?.hasActiveKey?.type ??
                                  "N/A"}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <Coins className="h-3.5 w-3.5 text-amber-500" />
                                <span className="text-sm">
                                  <span className="font-medium">
                                    {user.usage.totalProcess}
                                  </span>
                                  /{user.usage.credit}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">
                                {format(
                                  new Date(user.createdAt),
                                  "MMM d, yyyy"
                                )}
                              </span>
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
                                  <Link href={`/admin/users/${user._id}`}>
                                    View details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
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
                        <TableCell colSpan={9} className="h-24 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Users className="h-8 w-8 text-muted-foreground/60" />
                            <p className="text-muted-foreground">
                              No users found.
                            </p>
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
                  {searchTerm && (
                    <span>
                      {" "}
                      matching &quot;<strong>{searchTerm}</strong>&quot;
                    </span>
                  )}
                  {roleFilter !== "all" && (
                    <span>
                      {" "}
                      with role &quot;<strong>{roleFilter}</strong>&quot;
                    </span>
                  )}
                </div>
                <PaginationView
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  paginationItemsToDisplay={5}
                  handlePageChange={handlePageChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription className="pt-4">
              <div className="space-y-4">
                <p className="text-red-500 font-medium">
                  Warning: This action cannot be undone. This will permanently
                  delete:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>User account and profile</li>
                  <li>All associated images and data</li>
                  <li>Usage history and statistics</li>
                </ul>
                <p className="font-medium">
                  Are you sure you want to delete user{" "}
                  <span className="text-primary">{userToDelete?.name}</span>?
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
