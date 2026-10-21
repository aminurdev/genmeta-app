import { createMetadata } from "@/lib/seo";
import { getLatestRelease } from "@/lib/release-info";
import { LandingPageLayout } from "@/components/seo/LandingPageLayout";
import { Camera, FileSpreadsheet, FolderOpen, ListOrdered, SlidersHorizontal, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Shutterstock Metadata Generator — AI Keywords & Descriptions | GenMeta",
  description:
    "Generate accurate titles, descriptions, and 40-50 keywords for Shutterstock contributors with GenMeta. Fast batch processing, CSV export, and IPTC embedding.",
  path: "/for-shutterstock",
  keywords: [
    "Shutterstock metadata generator",
    "Shutterstock keyword generator",
    "Shutterstock AI keyword generator",
    "Shutterstock title generator",
    "Shutterstock contributor metadata",
    "Shutterstock batch keywording",
  ],
});

const GUIDELINES = [
  {
    title: "Descriptive 5+ Word Titles",
    detail:
      "Shutterstock prefers descriptive titles that explain who, what, when, and where. GenMeta writes natural English titles that describe the subject accurately.",
  },
  {
    title: "Up to 50 Relevant Keywords",
    detail:
      "Shutterstock allows up to 50 keywords per asset. GenMeta generates comprehensive sets of 40-50 keywords without spammy or unrelated terms.",
  },
  {
    title: "Shutterstock CSV Mapping",
    detail:
      "Export CSV files matching Shutterstock's upload specifications (Filename, Description, Keywords, Categories) for bulk upload in contributor portal.",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "Detailed Shutterstock Descriptions",
    description:
      "Generates clear, informative descriptions that answer what is in the shot, the setting, and mood without spam phrases.",
  },
  {
    icon: ListOrdered,
    title: "40–50 Targeted Keywords",
    description:
      "Extracts concrete nouns, conceptual descriptors, colors, actions, and settings to build full keyword lists that maximize discovery.",
  },
  {
    icon: FileSpreadsheet,
    title: "Shutterstock-Ready CSV Export",
    description:
      "One-click export produces CSV spreadsheets ready to import directly through Shutterstock's catalog management tool.",
  },
  {
    icon: FolderOpen,
    title: "Batch Process Entire Shoots",
    description:
      "Process 50, 100, or 500 photos and videos in one run. Review everything in an organized desktop grid before exporting.",
  },
  {
    icon: Camera,
    title: "Photos, Footage & Vectors",
    description:
      "Uniform metadata workflow for Shutterstock photos, 4K video clips, vector illustrations, and backgrounds.",
  },
  {
    icon: SlidersHorizontal,
    title: "Custom Banned Words & Style",
    description:
      "Filter out editorial-only terms, avoid trademark pitfalls, or restrict word counts according to your personal submission preferences.",
  },
];

const FAQS = [
  {
    question: "Does GenMeta generate up to 50 keywords for Shutterstock?",
    answer:
      "Yes. GenMeta generates comprehensive sets of 40 to 50 relevant keywords per asset, covering primary subjects, secondary details, lighting, mood, and commercial concepts.",
  },
  {
    question: "Can I export Shutterstock-formatted CSV files?",
    answer:
      "Yes. GenMeta exports agency-specific CSV files with column headers tailored for the Shutterstock contributor portal, including Filename, Description, Keywords, and Category.",
  },
  {
    question: "How does GenMeta prevent keyword rejection on Shutterstock?",
    answer:
      "GenMeta's AI is instructed to avoid spam words, brand names, and generic filler that reviewers flag. You can also customize negative keywords and banned terms.",
  },
  {
    question: "Is GenMeta a desktop app or website?",
    answer:
      "GenMeta is a dedicated desktop application for Windows. It processes your files locally on your machine, eliminating slow cloud upload queues.",
  },
];

export default async function ForShutterstockPage() {
  const releaseInfo = await getLatestRelease();

  return (
    <LandingPageLayout
      badge="Shutterstock Contributor Tool"
      h1="AI Metadata Generator for Shutterstock"
      description="Create stock-ready titles, descriptions, and 50 targeted keywords for your Shutterstock portfolio in seconds. Batch process hundreds of photos, vectors, and footage clips with desktop speed."
      secondaryCopy="GenMeta eliminates repetitive manual keywording, helping you submit content to Shutterstock faster and with greater consistency."
      breadcrumbName="Shutterstock Metadata"
      currentPath="/for-shutterstock"
      downloadUrl={releaseInfo?.downloadUrl ?? "/download"}
      guidelinesTitle="Shutterstock Contributor Best Practices"
      guidelines={GUIDELINES}
      features={FEATURES}
      faqs={FAQS}
    />
  );
}
