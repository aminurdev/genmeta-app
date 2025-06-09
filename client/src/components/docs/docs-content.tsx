import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, Github } from "lucide-react";

export function DocsContent() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div id="overview" className="space-y-4">
        <div className="flex items-center gap-2">
          <h1 className="text-4xl font-bold tracking-tight">Card Component</h1>
          <Badge variant="secondary">v2.1.0</Badge>
        </div>
        <p className="text-xl text-muted-foreground">
          A flexible container component for displaying content in a structured
          format.
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm">
            <Github className="size-4 mr-2" />
            View Source
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="size-4 mr-2" />
            Storybook
          </Button>
        </div>
      </div>

      <Separator />

      {/* Quick Example */}
      <div className="space-y-4">
        <h2 id="quick-example" className="text-2xl font-semibold">
          Quick Example
        </h2>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create project</CardTitle>
            <CardDescription>
              Deploy your new project in one-click.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Deploy</Button>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Installation */}
      <div className="space-y-4">
        <h2 id="installation" className="text-2xl font-semibold">
          Installation
        </h2>
        <div className="bg-muted rounded-lg p-4 relative">
          <code className="text-sm">npx shadcn@latest add card</code>
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-2 top-2 size-8 p-0"
          >
            <Copy className="size-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Usage */}
      <div className="space-y-4">
        <h2 id="usage" className="text-2xl font-semibold">
          Usage
        </h2>
        <Tabs defaultValue="preview" className="w-full">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-6 bg-background">
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>You have 3 unread messages.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 rounded-md border p-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Push Notifications
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Send notifications to device.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="code">
            <div className="bg-muted rounded-lg p-4 relative">
              <pre className="text-sm overflow-x-auto">
                <code>{`import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function CardDemo() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 rounded-md border p-4">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">
              Push Notifications
            </p>
            <p className="text-sm text-muted-foreground">
              Send notifications to device.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}`}</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-2 size-8 p-0"
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* API Reference */}
      <div className="space-y-4">
        <h2 id="api-reference" className="text-2xl font-semibold">
          API Reference
        </h2>
        <div className="space-y-6">
          <div>
            <h3 id="card" className="text-lg font-medium mb-2">
              Card
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              The root container component.
            </p>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Prop</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Default</th>
                    <th className="text-left p-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3 font-mono">className</td>
                    <td className="p-3">string</td>
                    <td className="p-3">-</td>
                    <td className="p-3">Additional CSS classes</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-3 font-mono">children</td>
                    <td className="p-3">ReactNode</td>
                    <td className="p-3">-</td>
                    <td className="p-3">Card content</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 id="card-header" className="text-lg font-medium mb-2">
              CardHeader
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Contains the card title and description.
            </p>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Prop</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Default</th>
                    <th className="text-left p-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3 font-mono">className</td>
                    <td className="p-3">string</td>
                    <td className="p-3">-</td>
                    <td className="p-3">Additional CSS classes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Examples */}
      <div className="space-y-4">
        <h2 id="examples" className="text-2xl font-semibold">
          Examples
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Simple Card</CardTitle>
              <CardDescription>
                A basic card with title and content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This is a simple card example with minimal content.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interactive Card</CardTitle>
              <CardDescription>
                A card with interactive elements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" className="w-full">
                Primary Action
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                Secondary Action
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
