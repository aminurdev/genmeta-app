import { getProfile } from "@/services/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  AppWindowMac,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { PasswordChangeForm } from "@/components/dashboard/password-change-form";
import { PlanSwitcher } from "@/components/dashboard/plan-switcher";

export default async function ProfilePage() {
  const profile = await getProfile();

  if (!profile.success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">
            Failed to load profile
          </h2>
          <p className="text-muted-foreground">{profile.message}</p>
        </div>
      </div>
    );
  }

  const { data } = profile;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP");
  };

  const formatCredit = (credit: number | null) => {
    if (credit === null) {
      return "Unlimited";
    }
    return credit.toLocaleString();
  };

  const hasEmailProvider = data.loginProvider.includes("email");

  return (
    <div className="space-y-6 p-4 pt-0">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Profile</h3>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={data.avatar || `https://avatar.vercel.sh/${data.email}`}
                  alt={data.name}
                />
                <AvatarFallback className="text-lg">
                  {getInitials(data.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="text-lg font-medium">{data.name}</h4>
                <p className="text-sm text-muted-foreground">{data.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="capitalize">
                    {data.role}
                  </Badge>
                  {data.isVerified && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Login Methods</span>
                <div className="flex gap-1">
                  {data.loginProvider.map((provider: string) => (
                    <Badge
                      key={provider}
                      variant="outline"
                      className="text-xs capitalize"
                    >
                      {provider}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Account Status</span>
                <div className="flex items-center gap-1">
                  {data.isDisabled ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <Badge variant="destructive">Disabled</Badge>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Badge variant="default">Active</Badge>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Member Since</span>
                <span className="text-sm">{formatDate(data.createdAt)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Web Credits</span>
                <Badge variant="outline">
                  {data.webCreditRemaining} remaining
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* API Key Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AppWindowMac className="h-5 w-5" />
              App Information
            </CardTitle>
            <CardDescription>Your app access and usage details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.apiKey ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Plan Type</span>
                  <Badge variant="outline" className="capitalize">
                    {data.apiKey.plan.type}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status</span>
                  <div className="flex items-center gap-1">
                    {data.apiKey.isActive ? (
                      <>
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <Badge variant="default" className="capitalize">
                          {data.apiKey.status}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <Badge variant="destructive">Inactive</Badge>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Processes</span>
                  <span className="text-sm font-medium">
                    {data.apiKey.totalProcess.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">API Credits</span>
                  <Badge variant="secondary">
                    {formatCredit(data.apiKey.credit)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Expires At</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">
                      {formatDate(data.apiKey.expiresAt)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                This account has not registered an app yet.
              </div>
            )}
          </CardContent>
        </Card>
        {/* Plan Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Plan Management
            </CardTitle>
            <CardDescription>Manage your plan and billing</CardDescription>
          </CardHeader>
          <CardContent>
            <PlanSwitcher />
          </CardContent>
        </Card>{" "}
        {/* Security Section - Only show if user has email login */}
        {hasEmailProvider && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordChangeForm />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
