import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export default function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Token Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,500</div>
            <p className="text-xs text-muted-foreground">+150 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Images Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground">+24 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <Progress value={68} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Pro</div>
            <p className="text-xs text-muted-foreground">Renews in 14 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent image processing jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>landscape-enhance.jpg</TableCell>
                  <TableCell>Today, 2:30 PM</TableCell>
                  <TableCell>50</TableCell>
                  <TableCell>
                    <Badge>Completed</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>portrait-retouch.png</TableCell>
                  <TableCell>Today, 11:15 AM</TableCell>
                  <TableCell>75</TableCell>
                  <TableCell>
                    <Badge>Completed</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>product-background.jpg</TableCell>
                  <TableCell>Yesterday</TableCell>
                  <TableCell>100</TableCell>
                  <TableCell>
                    <Badge>Completed</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>batch-resize-23.zip</TableCell>
                  <TableCell>Yesterday</TableCell>
                  <TableCell>250</TableCell>
                  <TableCell>
                    <Badge>Completed</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="ml-auto">
              View All
            </Button>
          </CardFooter>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Purchase</CardTitle>
            <CardDescription>Buy more tokens for your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token-amount">Token Package</Label>
              <Select defaultValue="500">
                <SelectTrigger>
                  <SelectValue placeholder="Select token package" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 Tokens - $5.99</SelectItem>
                  <SelectItem value="500">500 Tokens - $24.99</SelectItem>
                  <SelectItem value="1000">1000 Tokens - $44.99</SelectItem>
                  <SelectItem value="5000">5000 Tokens - $199.99</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select defaultValue="card">
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit Card •••• 4242</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="new">Add New Payment Method</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Purchase Tokens</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

