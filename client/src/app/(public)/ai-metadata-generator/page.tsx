import { createMetadata } from "@/lib/seo";
import { getLatestRelease } from "@/lib/release-info";
import { LandingPageLayout } from "@/components/seo/LandingPageLayout";
import { FileSpreadsheet, FolderOpen, Layers, Lock, Sparkles, Tag } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "AI Metadata Generator for Images, Vectors & Video | GenMeta",
  description:
    "Generate titles, descriptions, keywords, and categories for stock images, vectors, and videos with GenMeta's AI desktop app. Batch process your files and export agency-ready metadata.",
  path: "/ai-metadata-generator",
  keywords: [
    "AI metadata generator",
    "stock metadata generator",
    "AI metadata generator for stock images",
    "AI metadata generator for microstock",
    "bulk metadata generator",
    "bulk image metadata generator",
    "batch metadata generator",
    "desktop stock metadata generator",
    "IPTC metadata generator",
    "XMP metadata generator",
  ],
});

const GUIDELINES = [
  {
    title: "Titles & Descriptions",
    detail:
      "Accurate, clear descriptions summarizing the primary subject, context, and mood without spam phrases or generic stuffing.",
  },
  {
    title: "Prioritized Keywords",
    detail:
      "Ordered keywords placing the most essential search terms at the beginning of the list, aligned with agency ranking algorithms.",
  },
  {
    title: "IPTC, XMP & CSV Standards",
    detail:
      "Standards-compliant metadata embedding into image files or agency-specific CSV exports for multi-platform submission.",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "Comprehensive AI Metadata Generation",
    description:
      "Generates complete metadata sets including titles, descriptions, relevance-ordered keywords, and categories from your visual files.",
  },
  {
    icon: FolderOpen,
    title: "Bulk & Batch Processing",
    description:
      "Process entire folders with hundreds or thousands of assets in a single run instead of keywording files one at a time.",
  },
  {
    icon: Layers,
    title: "Photos, Vectors & Video Under One Roof",
    description:
      "One unified desktop application handles photography, vector graphics (EPS/SVG), 3D artwork, and stock video footage.",
  },
  {
    icon: Tag,
    title: "Direct EXIF / IPTC / XMP Embedding",
    description:
      "Write generated metadata directly into file headers so your titles and keywords travel permanently with your files.",
  },
  {
    icon: FileSpreadsheet,
    title: "Agency-Ready CSV Exports",
    description:
      "Export structured CSV files formatted for Adobe Stock, Shutterstock, Freepik, Getty Images, and iStock.",
  },
  {
    icon: Lock,
    title: "100% Local Desktop Privacy",
    description:
      "Keep your original high-resolution creative assets safe on your local drive with zero cloud file storage risks.",
  },
];

const FAQS = [
  {
    question: "What is an AI metadata generator?",
    answer:
      "An AI metadata generator uses computer vision models to analyze visual media (photos, vectors, video footage) and automatically write commercial-grade titles, descriptions, keyword tags, and categories for stock marketplaces.",
  },
  {
    question: "What components of metadata does GenMeta generate?",
    answer:
      "GenMeta generates four core metadata components: a descriptive title, an expanded editorial description, an ordered list of 40-50 relevant keywords, and appropriate stock asset categories.",
  },
  {
    question: "Does GenMeta write metadata into image files or CSV?",
    answer:
      "Both. GenMeta can embed metadata directly into file headers (IPTC, EXIF, and XMP) or export formatted CSV spreadsheets ready for agency bulk upload portals.",
  },
  {
    question: "Can I use GenMeta offline or with privacy?",
    answer:
      "GenMeta is a native Windows desktop app. Your original creative files never leave your computer. Only lightweight visual tokens are sent for AI analysis, ensuring maximum speed and security.",
  },
  {
    question: "Which stock agencies are supported?",
    answer:
      "GenMeta supports all major microstock agencies including Adobe Stock, Shutterstock, Freepik, Getty Images, iStock, Alamy, Pond5, Depositphotos, 123RF, and Dreamstime.",
  },
];

export default async function AiMetadataGeneratorPage() {
  const releaseInfo = await getLatestRelease();

  return (
    <LandingPageLayout
      badge="Comprehensive Metadata Suite"
      h1="AI Metadata Generator for Images, Vectors & Video"
      description="Turn large batches of creative files into organized, stock-ready metadata in seconds. Generate accurate titles, descriptions, keywords, and categories without spending hours keywording each file manually."
      secondaryCopy="Stock metadata includes titles, descriptions, keywords, and categories that help contributors prepare their content for stock marketplaces and buyer search discovery."
      breadcrumbName="AI Metadata Generator"
      currentPath="/ai-metadata-generator"
      downloadUrl={releaseInfo?.downloadUrl ?? "/download"}
      guidelinesTitle="What Makes Stock-Ready Metadata"
      guidelines={GUIDELINES}
      features={FEATURES}
      faqs={FAQS}
    />
  );
}
