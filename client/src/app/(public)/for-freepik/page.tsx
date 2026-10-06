import { createMetadata } from "@/lib/seo";
import { getLatestRelease } from "@/lib/release-info";
import { LandingPageLayout } from "@/components/seo/LandingPageLayout";
import { FileSpreadsheet, FolderOpen, Layers, ListOrdered, PenTool, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Freepik Metadata Generator — AI Titles & Tags for Vectors & Photos | GenMeta",
  description:
    "Generate titles and tags for Freepik vectors, PSD templates, and stock photos with GenMeta. Fast batch processing, local privacy, and Freepik CSV export.",
  path: "/for-freepik",
  keywords: [
    "Freepik metadata generator",
    "Freepik keyword generator",
    "Freepik vector tags",
    "Freepik AI metadata",
    "Freepik contributor tool",
    "Freepik photo tagging",
  ],
});

const GUIDELINES = [
  {
    title: "Vector & Illustration Tags",
    detail:
      "Freepik thrives on vector illustrations, icons, and templates. GenMeta identifies design styles (flat, isometric, gradient, doodle) and tags artistic elements accurately.",
  },
  {
    title: "Keyword Quantity & Precision",
    detail:
      "Freepik requires relevant, specific tags without keyword stuffing. GenMeta produces balanced keyword sets focused on primary subjects, occasions, and graphic types.",
  },
  {
    title: "CSV Bulk Submission",
    detail:
      "Export metadata directly into Freepik contributor-compatible CSV spreadsheets for quick catalog batch imports.",
  },
];

const FEATURES = [
  {
    icon: PenTool,
    title: "Vector & PSD Template Tagging",
    description:
      "Recognizes graphical layouts, UI components, background patterns, and illustration styles to generate precise design keywords.",
  },
  {
    icon: Sparkles,
    title: "Freepik-Ready Titles",
    description:
      "Creates natural, readable titles that accurately state the design asset and its intended commercial or editorial use case.",
  },
  {
    icon: ListOrdered,
    title: "Ordered Search Tags",
    description:
      "Generates relevant keyword sets ordered from the primary subject to secondary stylistic and conceptual terms.",
  },
  {
    icon: FolderOpen,
    title: "Bulk Folder Processing",
    description:
      "Drag and drop folders containing hundreds of EPS, SVG, PNG, and JPG files and tag them simultaneously.",
  },
  {
    icon: FileSpreadsheet,
    title: "Freepik CSV Export",
    description:
      "Export your batch into CSV spreadsheets structured for Freepik contributor catalog management.",
  },
  {
    icon: Layers,
    title: "Multi-Format Support",
    description:
      "Seamlessly handle vector artwork, photos, 3D renders, and video footage in one unified desktop workspace.",
  },
];

const FAQS = [
  {
    question: "Can GenMeta generate keywords for Freepik vector files?",
    answer:
      "Yes. GenMeta analyzes SVG files and vector preview images, automatically extracting design styles, color schemes, and themes like 'isolated banner', 'flat vector', and 'infographic template'.",
  },
  {
    question: "Does GenMeta export CSVs for Freepik upload?",
    answer:
      "Yes. You can export metadata in CSV format designed for microstock contributor workflows including Freepik.",
  },
  {
    question: "How many files can I process in a batch for Freepik?",
    answer:
      "GenMeta is a desktop app with no arbitrary per-batch limits. You can process folders with dozens, hundreds, or thousands of files in a single pass.",
  },
  {
    question: "Are my original vector assets uploaded to third-party clouds?",
    answer:
      "No. GenMeta runs locally on your Windows PC. Your original files stay on your computer, protecting your creative property.",
  },
];

export default async function ForFreepikPage() {
  const releaseInfo = await getLatestRelease();

  return (
    <LandingPageLayout
      badge="Freepik Contributor Tool"
      h1="AI Metadata Generator for Freepik"
      description="Generate high-converting titles, descriptions, and tags tailored for Freepik vectors, PSDs, and stock photos with superior visual recognition."
      secondaryCopy="Get started free: download for Windows with 50 credits included upon signup, no credit card required."
      breadcrumbName="Freepik Metadata"
      currentPath="/for-freepik"
      downloadUrl={releaseInfo?.downloadUrl ?? "/download"}
      guidelinesTitle="Freepik Contributor Best Practices"
      guidelines={GUIDELINES}
      features={FEATURES}
      faqs={FAQS}
    />
  );
}
