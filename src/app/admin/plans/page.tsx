"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  Trash,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePricingPlans, PricingPlan } from "@/hooks/use-pricing-plans";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function PlansPage() {
  const { plans, loading, error, createPlan, updatePlan, deletePlan } =
    usePricingPlans();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    tokens: 0,
    price: 0,
    discount: 0,
    popular: false,
  });

  // Filter plans based on search term
  const filteredPlans = plans.filter((plan) =>
    plan.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePlan = async () => {
    try {
      await createPlan(formData);
      setIsCreateDialogOpen(false);
      setFormData({
        title: "",
        tokens: 0,
        price: 0,
        discount: 0,
        popular: false,
      });
      toast.success("Plan created successfully");
    } catch {
      toast.error("Failed to create plan");
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;
    try {
      await updatePlan(selectedPlan._id, formData);
      setIsEditDialogOpen(false);
      setSelectedPlan(null);
      setFormData({
        title: "",
        tokens: 0,
        price: 0,
        discount: 0,
        popular: false,
      });
      toast.success("Plan updated successfully");
    } catch {
      toast.error("Failed to update plan");
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      await deletePlan(id);
      toast.success("Plan deleted successfully");
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  const handleEditPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setFormData({
      title: plan.title,
      tokens: plan.tokens,
      price: plan.price,
      discount: plan.discount,
      popular: plan.popular,
    });
    setIsEditDialogOpen(true);
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500">
            Error Loading Plans
          </h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Plan Management</h2>
          <div className="flex items-center gap-2"></div>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>
                Manage your subscription plans and pricing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="table" className="w-full">
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="table">Table View</TabsTrigger>
                    <TabsTrigger value="cards">Card View</TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-2">
                    <Dialog
                      open={isCreateDialogOpen}
                      onOpenChange={setIsCreateDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Create New Plan</DialogTitle>
                          <DialogDescription>
                            Add a new subscription plan to your platform.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="plan-title" className="text-right">
                              Title
                            </Label>
                            <Input
                              id="plan-title"
                              className="col-span-3"
                              value={formData.title}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  title: e.target.value,
                                })
                              }
                              placeholder="Pro Plan"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="plan-tokens" className="text-right">
                              Tokens
                            </Label>
                            <Input
                              id="plan-tokens"
                              type="number"
                              className="col-span-3"
                              value={formData.tokens}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  tokens: parseInt(e.target.value),
                                })
                              }
                              placeholder="1000"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="plan-price" className="text-right">
                              Price
                            </Label>
                            <Input
                              id="plan-price"
                              type="number"
                              className="col-span-3"
                              value={formData.price}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  price: parseInt(e.target.value),
                                })
                              }
                              placeholder="100"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="plan-discount"
                              className="text-right"
                            >
                              Discount
                            </Label>
                            <Input
                              id="plan-discount"
                              type="number"
                              className="col-span-3"
                              value={formData.discount}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  discount: parseInt(e.target.value),
                                })
                              }
                              placeholder="0"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="plan-popular"
                              className="text-right"
                            >
                              Popular
                            </Label>
                            <div className="col-span-3 flex items-center space-x-2">
                              <Checkbox
                                id="plan-popular"
                                checked={formData.popular}
                                onCheckedChange={(checked) =>
                                  setFormData({
                                    ...formData,
                                    popular: checked as boolean,
                                  })
                                }
                              />
                              <label
                                htmlFor="plan-popular"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Mark as popular
                              </label>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => {
                              setFormData({
                                title: "",
                                tokens: 0,
                                price: 0,
                                discount: 0,
                                popular: false,
                              });
                              handleCreatePlan();
                            }}
                          >
                            Create Plan
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-4">
                  <div className="flex flex-1 items-center gap-2">
                    <div className="relative flex-1 md:max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search plans..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <TabsContent value="table" className="space-y-4 pt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">
                            <div className="flex items-center gap-1">
                              Plan Name
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>Tokens</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Final Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              <Skeleton className="h-8 w-full" />
                            </TableCell>
                          </TableRow>
                        ) : filteredPlans.length > 0 ? (
                          filteredPlans.map((plan) => (
                            <TableRow key={plan._id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {plan.title}
                                  {plan.popular && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                                    >
                                      <Star className="mr-1 h-3 w-3 fill-amber-500 text-amber-500" />
                                      Popular
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{plan.tokens}</TableCell>
                              <TableCell>${plan.price}</TableCell>
                              <TableCell>{plan.discount}%</TableCell>
                              <TableCell>${plan.discountedPrice}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    plan.popular
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-gray-50 text-gray-700 border-gray-200"
                                  }
                                >
                                  {plan.popular ? "Popular" : "Standard"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => handleEditPlan(plan)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit plan
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleDeletePlan(plan._id)}
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete plan
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              No plans found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="cards" className="pt-4">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                          <CardHeader>
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                          </CardHeader>
                          <CardContent>
                            <Skeleton className="h-8 w-24 mb-4" />
                            <div className="space-y-2">
                              {Array.from({ length: 3 }).map((_, j) => (
                                <Skeleton key={j} className="h-4 w-full" />
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : filteredPlans.length > 0 ? (
                      filteredPlans.map((plan) => (
                        <Card
                          key={plan._id}
                          className={
                            plan.popular ? "border-amber-300 shadow-md" : ""
                          }
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle>{plan.title}</CardTitle>
                              {plan.popular && (
                                <Badge
                                  variant="secondary"
                                  className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                                >
                                  <Star className="mr-1 h-3 w-3 fill-amber-500 text-amber-500" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <CardDescription>
                              {plan.tokens} tokens
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="mb-4">
                              <span className="text-3xl font-bold">
                                ${plan.discountedPrice}
                              </span>
                              {plan.discount > 0 && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  (${plan.price} - {plan.discount}% off)
                                </span>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <Badge
                              variant="outline"
                              className={
                                plan.popular
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              }
                            >
                              {plan.popular ? "Popular" : "Standard"}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleEditPlan(plan)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit plan
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeletePlan(plan._id)}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete plan
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-10">
                        No plans found.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update the subscription plan details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-plan-title" className="text-right">
                Title
              </Label>
              <Input
                id="edit-plan-title"
                className="col-span-3"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Pro Plan"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-plan-tokens" className="text-right">
                Tokens
              </Label>
              <Input
                id="edit-plan-tokens"
                type="number"
                className="col-span-3"
                value={formData.tokens}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tokens: parseInt(e.target.value),
                  })
                }
                placeholder="1000"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-plan-price" className="text-right">
                Price
              </Label>
              <Input
                id="edit-plan-price"
                type="number"
                className="col-span-3"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseInt(e.target.value),
                  })
                }
                placeholder="100"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-plan-discount" className="text-right">
                Discount
              </Label>
              <Input
                id="edit-plan-discount"
                type="number"
                className="col-span-3"
                value={formData.discount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount: parseInt(e.target.value),
                  })
                }
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-plan-popular" className="text-right">
                Popular
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="edit-plan-popular"
                  checked={formData.popular}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      popular: checked as boolean,
                    })
                  }
                />
                <label
                  htmlFor="edit-plan-popular"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Mark as popular
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdatePlan}>Update Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
