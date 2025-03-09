import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function HistoryTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image Processing History</CardTitle>
          <CardDescription>Your recent image processing jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Process Type</TableHead>
                <TableHead>Tokens Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-md bg-muted"></div>
                    <span>landscape-enhance.jpg</span>
                  </div>
                </TableCell>
                <TableCell>Mar 9, 2025 2:30 PM</TableCell>
                <TableCell>Enhancement</TableCell>
                <TableCell>50</TableCell>
                <TableCell>
                  <Badge>Completed</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-md bg-muted"></div>
                    <span>portrait-retouch.png</span>
                  </div>
                </TableCell>
                <TableCell>Mar 9, 2025 11:15 AM</TableCell>
                <TableCell>Retouching</TableCell>
                <TableCell>75</TableCell>
                <TableCell>
                  <Badge>Completed</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-md bg-muted"></div>
                    <span>product-background.jpg</span>
                  </div>
                </TableCell>
                <TableCell>Mar 8, 2025 3:45 PM</TableCell>
                <TableCell>Background Removal</TableCell>
                <TableCell>100</TableCell>
                <TableCell>
                  <Badge>Completed</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-md bg-muted"></div>
                    <span>batch-resize-23.zip</span>
                  </div>
                </TableCell>
                <TableCell>Mar 8, 2025 10:20 AM</TableCell>
                <TableCell>Batch Resize</TableCell>
                <TableCell>250</TableCell>
                <TableCell>
                  <Badge>Completed</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-md bg-muted"></div>
                    <span>logo-vectorize.ai</span>
                  </div>
                </TableCell>
                <TableCell>Mar 7, 2025 4:10 PM</TableCell>
                <TableCell>Vectorization</TableCell>
                <TableCell>150</TableCell>
                <TableCell>
                  <Badge>Completed</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-md bg-muted"></div>
                    <span>website-banner.psd</span>
                  </div>
                </TableCell>
                <TableCell>Mar 6, 2025 1:30 PM</TableCell>
                <TableCell>Style Transfer</TableCell>
                <TableCell>125</TableCell>
                <TableCell>
                  <Badge>Completed</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Showing 6 of 24 entries</div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

