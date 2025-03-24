import PricingTabs from "@/components/pricing-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

const PricingPage = () => {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-5xl">
          <span className="block">Supercharge Your Experience</span>
          <span className="block text-primary mt-2">with Token Packages</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
          Choose the perfect token package that fits your needs. Pay once and
          use your tokens anytime - they never expire.
        </p>
      </div>
      <div className="flex justify-center mb-8">
        <div className="bg-primary/10 text-primary rounded-lg px-4 py-2 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">
            One-time purchase, tokens never expire
          </span>
        </div>
      </div>
      <PricingTabs />
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto grid gap-4 text-left">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How do tokens work?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tokens are used to generate and process metadata for images.
                Every image processing request costs only one token, You can
                multiple image process at a time.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                How long do my tokens last?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your purchased tokens <strong>never expire</strong>. This is a
                one-time purchase, and your tokens will remain in your account
                until you use them, with no time limit.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="mt-16 bg-primary/5 rounded-2xl p-8 max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Need a custom solution?</h2>
          <p className="text-muted-foreground mt-2">
            Contact our sales team for enterprise pricing and custom packages
          </p>
        </div>
        <div className="flex justify-center">
          <Button variant="outline" className="mr-4" asChild>
            <a href="mailto:helpgenmeta@gmail.com">Contact</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
