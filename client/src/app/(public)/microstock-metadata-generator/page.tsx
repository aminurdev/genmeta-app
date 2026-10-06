import { createMetadata } from "@/lib/seo";
import { getLatestRelease } from "@/lib/release-info";
import { LandingPageLayout } from "@/components/seo/LandingPageLayout";
import { FileSpreadsheet, FolderOpen, Layers, ListOrdered, Lock, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Microstock Metadata Generator — AI Keywording Software | GenMeta",
  description:
    "AI-powered desktop metadata generator for microstock creators. Generate stock-ready titles, descriptions, and keywords for Adobe Stock, Shutterstock, Freepik, and more.",
  path: "/microstock-metadata-generator",
  keywords: [
    "microstock metadata generator",
    "microstock keyword generator",
    "microstock keywording software",
    "microstock SEO tool",
    "stock contributor keywording tool",
    "stock photo tagging software",
    "stock photo metadata software",
    "AI microstock tool",
    "stock contributor tools",
  ],
});

const GUIDELINES = [
  {
    title: "Multi-Agency Compatibility",
    detail:
      "Prepare metadata once and distribute across Adobe Stock, Shutterstock, Freepik, iStock, 123RF, Alamy, and Dreamstime without rewriting.",
  },
  {
    title: "Batch Volume Efficiency",
    detail:
      "Designed for creators uploading tens or hundreds of assets weekly. Automates the tedious metadata stage of stock contribution.",
  },
  {
    title: "Controllable Quality",
    detail:
      "Full review and customization controls to preserve contributor style and maintain high agency review acceptance rates.",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Keywording for Microstock Creators",
    description:
      "Generate titles, descriptions, and keywords specifically formatted for the rules and algorithms of leading microstock agencies.",
  },
  {
    icon: FolderOpen,
    title: "Unlimited Desktop Batch Processing",
    description:
      "Point GenMeta at your project folders and process hundreds of files in one run directly on your Windows PC.",
  },
  {
    icon: Layers,
    title: "Unified Media Support",
    description:
      "Tag commercial stills, vectors, illustration sets, and 4K footage clips in a single streamlined interface.",
  },
  {
    icon: ListOrdered,
    title: "Marketplace Search Ranking",
    description:
      "Keywords are intelligently ordered by relevance, putting the terms agencies weight most heavily in front positions.",
  },
  {
    icon: FileSpreadsheet,
    title: "Multi-Platform CSV Exports",
    description:
      "Export agency-ready CSV spreadsheets formatted for individual submission portals with correct column structures.",
  },
  {
    icon: Lock,
    title: "Safe Local Storage",
    description:
      "Your high-resolution master catalogs stay secure on your local hard drives without uploading full files to web servers.",
  },
];

const FAQS = [
  {
    question: "Why should microstock contributors use GenMeta instead of web keywording tools?",
    answer:
      "Web tools require uploading large original files over slow connections and often charge per-image fees. GenMeta is a desktop app for Windows that works locally on your folders with blazing speed and complete file privacy.",
  },
  {
    question: "Can I prepare assets for multiple agencies at once?",
    answer:
      "Yes. GenMeta creates a standardized metadata profile for each asset and allows you to export tailored CSV spreadsheets for Adobe Stock, Shutterstock, Freepik, and more in one click.",
  },
  {
    question: "How does GenMeta help microstock creators save time?",
    answer:
      "Writing metadata manually for 50 files takes 2-3 hours. GenMeta generates accurate titles, descriptions, and 50 ordered keywords for an entire batch in seconds, freeing you to create more content.",
  },
  {
    question: "What platforms does GenMeta support?",
    answer:
      "GenMeta supports Adobe Stock, Shutterstock, Freepik, Getty Images, iStock, Alamy, Pond5, Depositphotos, 123RF, and Dreamstime.",
  },
];

export default async function MicrostockMetadataGeneratorPage() {
  const releaseInfo = await getLatestRelease();

  return (
    <LandingPageLayout
      badge="Microstock Contributor Software"
      h1="AI Metadata Generator for Microstock Creators"
      description="The AI-powered desktop metadata generator built for high-volume stock contributors. Generate accurate titles, descriptions, and keywords for your stock images, vectors, and videos in seconds."
      secondaryCopy="GenMeta helps microstock creators turn large batches of creative files into organized, stock-ready metadata without spending hours keywording each file manually."
      breadcrumbName="Microstock Metadata"
      currentPath="/microstock-metadata-generator"
      downloadUrl={releaseInfo?.downloadUrl ?? "/download"}
      guidelinesTitle="Microstock Contributor Workflow"
      guidelines={GUIDELINES}
      features={FEATURES}
      faqs={FAQS}
    />
  );
}
