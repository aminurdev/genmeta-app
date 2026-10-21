import { createMetadata } from "@/lib/seo";
import { getLatestRelease } from "@/lib/release-info";
import { LandingPageLayout } from "@/components/seo/LandingPageLayout";
import { Camera, FileSpreadsheet, ListOrdered, SlidersHorizontal, Sparkles, Tag } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Adobe Stock Metadata Generator — AI Keywords & Titles | GenMeta",
  description:
    "Generate stock-ready titles, descriptions, and keywords for Adobe Stock. Relevance-ranked keywords, optimal 70-character titles, and CSV export for Adobe Stock contributors.",
  path: "/for-adobe-stock",
  keywords: [
    "Adobe Stock metadata generator",
    "Adobe Stock keyword generator",
    "Adobe Stock AI keyword generator",
    "Adobe Stock title generator",
    "Adobe Stock description generator",
    "AI metadata for Adobe Stock",
    "Adobe Stock contributor keywording",
  ],
});

const GUIDELINES = [
  {
    title: "Keyword Order Priority",
    detail:
      "Adobe Stock places strong emphasis on your first 5 to 10 keywords. GenMeta automatically places the most relevant visual and conceptual terms first.",
  },
  {
    title: "Optimized Title Length",
    detail:
      "Adobe contributor guidelines recommend concise titles up to 70 characters without spammy repetitive words. GenMeta generates natural, descriptive titles.",
  },
  {
    title: "Adobe-Ready CSV Format",
    detail:
      "Export CSV spreadsheets mapped directly to Adobe Stock's required upload columns (Filename, Title, Keywords, Category).",
  },
];

const FEATURES = [
  {
    icon: ListOrdered,
    title: "Relevance-Ranked Keywords",
    description:
      "Ensures the most critical subject terms, actions, and concepts appear in positions 1-10 where Adobe search weights them highest.",
  },
  {
    icon: Sparkles,
    title: "Descriptive Titles Without Fluff",
    description:
      "Writes informative titles matching Adobe Stock review guidelines rather than generic or keyword-stuffed strings.",
  },
  {
    icon: FileSpreadsheet,
    title: "Instant Adobe Stock CSV Export",
    description:
      "Generate an agency-formatted CSV file in one click. Upload your media and CSV together to Adobe Contributor Portal with zero manual editing.",
  },
  {
    icon: Tag,
    title: "Direct IPTC / XMP Embedding",
    description:
      "Embed metadata straight into your JPEG, TIFF, or vector sidecars so Adobe Stock auto-reads your titles and keywords on upload.",
  },
  {
    icon: Camera,
    title: "Photos, Vectors & Video Support",
    description:
      "Whether you shoot stock photos, create vector illustrations, or produce 4K footage, GenMeta formats metadata for each asset type.",
  },
  {
    icon: SlidersHorizontal,
    title: "Custom House Style Prompts",
    description:
      "Define banned words, restrict specific trademarks, or enforce your preferred naming taxonomy across entire catalogs.",
  },
];

const FAQS = [
  {
    question: "Why does keyword order matter for Adobe Stock?",
    answer:
      "Adobe Stock's search algorithm specifically weights the first 5 to 10 keywords more heavily than subsequent terms when indexing search results. GenMeta automatically analyzes subject prominence and places primary terms first.",
  },
  {
    question: "Can I upload GenMeta's CSV directly to Adobe Stock?",
    answer:
      "Yes. GenMeta exports CSV files structured precisely with the column headers Adobe Stock Contributor Portal requires: Filename, Title, Keywords, and Category.",
  },
  {
    question: "Does GenMeta generate titles within Adobe's recommended length?",
    answer:
      "Yes. Adobe Stock recommends titles under 70 characters that clearly describe the asset. GenMeta defaults to concise, accurate titles that pass contributor review.",
  },
  {
    question: "Does GenMeta work for Adobe Stock vector illustrations?",
    answer:
      "Yes. GenMeta analyzes vector illustrations (EPS and SVG renders), generating style-specific keywords such as 'flat illustration', 'vector graphic', 'isolated on white', and color themes.",
  },
  {
    question: "Does GenMeta upload my original files to third-party servers?",
    answer:
      "No. GenMeta runs locally as a Windows desktop application. Your high-resolution files stay on your machine, preserving your privacy and saving bandwidth.",
  },
];

export default async function ForAdobeStockPage() {
  const releaseInfo = await getLatestRelease();

  return (
    <LandingPageLayout
      badge="Adobe Stock Contributor Tool"
      h1="AI Metadata Generator for Adobe Stock"
      description="Generate stock-ready titles, descriptions, and relevance-ordered keywords for your Adobe Stock portfolio in seconds. Process files in batches, review results, and export Adobe-ready CSV files."
      secondaryCopy="GenMeta automates repetitive keywording while keeping you in full control of your metadata before upload."
      breadcrumbName="Adobe Stock Metadata"
      currentPath="/for-adobe-stock"
      downloadUrl={releaseInfo?.downloadUrl ?? "/download"}
      guidelinesTitle="Adobe Stock Contributor Best Practices"
      guidelines={GUIDELINES}
      features={FEATURES}
      faqs={FAQS}
    />
  );
}
