import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function TokensTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Token Balance</CardTitle>
          <CardDescription>Your current token balance and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Available Tokens</p>
              <p className="text-3xl font-bold">2,500</p>
            </div>
            <div>
              <p className="text-sm font-medium">Used This Month</p>
              <p className="text-3xl font-bold">1,750</p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Purchased</p>
              <p className="text-3xl font-bold">5,000</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <p>Monthly Usage</p>
              <p>1,750 / 5,000</p>
            </div>
            <Progress value={35} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Tokens</CardTitle>
          <CardDescription>Buy more tokens for your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Starter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-3xl font-bold">100</p>
                <p className="text-sm text-muted-foreground">Tokens</p>
                <p className="font-medium">$5.99</p>
                <p className="text-xs text-muted-foreground">$0.059 per token</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Purchase
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Basic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-3xl font-bold">500</p>
                <p className="text-sm text-muted-foreground">Tokens</p>
                <p className="font-medium">$24.99</p>
                <p className="text-xs text-muted-foreground">$0.049 per token</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Purchase
                </Button>
              </CardFooter>
            </Card>
            <Card className="border-primary">
              <CardHeader className="pb-2">
                <Badge className="absolute right-2 top-2">Popular</Badge>
                <CardTitle className="text-lg">Pro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-3xl font-bold">1000</p>
                <p className="text-sm text-muted-foreground">Tokens</p>
                <p className="font-medium">$44.99</p>
                <p className="text-xs text-muted-foreground">$0.044 per token</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Purchase</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Enterprise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-3xl font-bold">5000</p>
                <p className="text-sm text-muted-foreground">Tokens</p>
                <p className="font-medium">$199.99</p>
                <p className="text-xs text-muted-foreground">$0.039 per token</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Purchase
                </Button>
              </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Token History</CardTitle>
          <CardDescription>Your token purchase and usage history</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Mar 8, 2025</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700"
                  >
                    Purchase
                  </Badge>
                </TableCell>
                <TableCell>Token Package: Pro</TableCell>
                <TableCell className="text-right text-green-600">+1000</TableCell>
                <TableCell className="text-right">2500</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Mar 7, 2025</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700">
                    Usage
                  </Badge>
                </TableCell>
                <TableCell>Batch Processing: 10 images</TableCell>
                <TableCell className="text-right text-red-600">-250</TableCell>
                <TableCell className="text-right">1500</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Mar 5, 2025</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700">
                    Usage
                  </Badge>
                </TableCell>
                <TableCell>Image Enhancement: product-photo.jpg</TableCell>
                <TableCell className="text-right text-red-600">-75</TableCell>
                <TableCell className="text-right">1750</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Mar 1, 2025</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700"
                  >
                    Purchase
                  </Badge>
                </TableCell>
                <TableCell>Token Package: Basic</TableCell>
                <TableCell className="text-right text-green-600">+500</TableCell>
                <TableCell className="text-right">1825</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="ml-auto">
            View All Transactions
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

