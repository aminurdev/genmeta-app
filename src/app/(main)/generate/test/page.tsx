import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import UploadForm from "@/components/main/upload-formv2 test";

export const metadata: Metadata = {
  title: "Image SEO Generator",
  description:
    "Generate SEO-friendly metadata for your images including titles, descriptions, and keywords",
};

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Image SEO Generator
          </h1>
          <p className="mt-3 text-xl text-muted-foreground">
            Upload images and generate SEO-friendly titles, descriptions, and
            keywords
          </p>
          <Button variant={"link"} asChild>
            <Link href="/results">View previously uploaded files</Link>
          </Button>
        </div>

        <UploadForm />
      </div>
    </div>
  );
}
