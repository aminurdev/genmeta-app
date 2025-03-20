import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help | GenMeta",
  description: "Learn how to use our image processing platform",
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Help Center</h1>

        {/* Quick Start Guide */}
        <section className="bg-muted/20 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Start Guide</h2>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </span>
              <div>
                <h3 className="font-semibold mb-1">Create an Account</h3>
                <p className="text-muted-foreground">
                  Sign up for a free account and get 20 tokens to start
                  processing your images.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </span>
              <div>
                <h3 className="font-semibold mb-1">Upload Images</h3>
                <p className="text-muted-foreground">
                  Upload your images individually or in batch. We support JPEG,
                  PNG, and WebP formats.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </span>
              <div>
                <h3 className="font-semibold mb-1">Process Images</h3>
                <p className="text-muted-foreground">
                  Our AI will analyze your images and generate metadata. Each
                  image costs 1 token to process.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                4
              </span>
              <div>
                <h3 className="font-semibold mb-1">Download Results</h3>
                <p className="text-muted-foreground">
                  Download your processed images and metadata in various formats
                  (ZIP, CSV).
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* FAQs */}
        <section className="bg-muted/20 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">What are tokens?</h3>
              <p className="text-muted-foreground">
                Tokens are our processing credits. Each image you process costs
                1 token. New users get 20 free tokens to start.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                What image formats are supported?
              </h3>
              <p className="text-muted-foreground">
                We currently support JPEG, PNG, and WebP image formats. Maximum
                file size is 25MB per image.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                How accurate is the AI metadata?
              </h3>
              <p className="text-muted-foreground">
                Our AI generates highly accurate metadata based on image
                content. You can always edit the generated metadata if needed.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                Can I process multiple images at once?
              </h3>
              <p className="text-muted-foreground">
                Yes! You can upload and process multiple images in batch. Each
                image will still cost 1 token.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="bg-muted/20 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">Need More Help?</h2>
          <p className="text-muted-foreground mb-4">
            If you can&apos;t find the answer you&apos;re looking for, our
            support team is here to help.
          </p>
          <a
            href="mailto:helpgenmeta@gmail.com"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </a>
        </section>
      </div>
    </div>
  );
}
