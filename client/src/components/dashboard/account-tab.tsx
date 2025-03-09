import { CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function AccountTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Update your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" defaultValue="Acme Inc." />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Manage your subscription plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">Pro Plan</p>
                  <p className="text-sm text-muted-foreground">$49.99/month</p>
                </div>
                <Badge>Active</Badge>
              </div>
              <div className="mt-4 text-sm">
                <p>Renews on April 9, 2025</p>
                <p className="mt-2">Includes 5,000 tokens per month</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <CreditCard className="h-5 w-5" />
                <div>
                  <p className="font-medium">Visa ending in 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 12/2026</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start space-y-2">
            <div className="flex gap-2">
              <Button variant="outline">Change Plan</Button>
              <Button variant="outline">Update Payment</Button>
            </div>
            <Button variant="link" className="h-auto p-0 text-red-500">
              Cancel Subscription
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage your API keys for programmatic access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">Production Key</p>
                <p className="mt-1 font-mono text-sm">sk_live_•••••••••••••••••••••••••••••</p>
              </div>
              <Button variant="outline" size="sm">
                Reveal
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Created on February 12, 2025</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">Development Key</p>
                <p className="mt-1 font-mono text-sm">sk_test_•••••••••••••••••••••••••••••</p>
              </div>
              <Button variant="outline" size="sm">
                Reveal
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Created on March 1, 2025</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Generate New API Key</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <div className="flex items-center space-x-2 pt-4">
            <div className="flex-1 space-y-1">
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <Button variant="outline">Enable</Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Update Password</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

