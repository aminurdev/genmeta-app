import { createMetadata } from "@/lib/seo";
import { getLatestRelease } from "@/lib/release-info";
import { LandingPageLayout } from "@/components/seo/LandingPageLayout";
import { Camera, FileSpreadsheet, FolderOpen, ListOrdered, SlidersHorizontal, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "AI Stock Keyword Generator — Generate Keywords from Images | GenMeta",
  description:
    "Turn your photos and vectors into relevant stock keywords with AI. GenMeta analyzes your content and generates descriptive, ordered keyword sets for microstock workflows.",
  path: "/ai-stock-keyword-generator",
  keywords: [
    "AI stock keyword generator",
    "stock keyword generator",
    "AI keyword generator",
    "image keyword generator",
    "stock photo keyword generator",
    "microstock keyword generator",
    "AI image tagging",
    "stock photo tags",
    "stock image keywords",
    "stock photo SEO keyword generator",
  ],
});

const GUIDELINES = [
  {
    title: "Relevance Ranking",
    detail:
      "Arranges keywords in decreasing order of visual and thematic importance so primary keywords appear in the top 5 to 10 positions.",
  },
  {
    title: "Zero Irrelevant Spam",
    detail:
      "Prevents keyword spamming and off-topic filler tags that result in stock agency review rejection.",
  },
  {
    title: "Comprehensive Coverage",
    detail:
      "Combines concrete subject tags, conceptual associations, color schemes, framing styles, and emotional moods.",
  },
];

const FEATURES = [
  {
    icon: ListOrdered,
    title: "Relevance-Ordered Keywords",
    description:
      "Places the most essential subject terms at the front of the list, perfectly tailored for Adobe Stock and Shutterstock search weighting.",
  },
  {
    icon: Sparkles,
    title: "AI Visual Inspection",
    description:
      "Identifies specific objects, architecture, species, clothing, emotions, and subtle background details from image pixels.",
  },
  {
    icon: SlidersHorizontal,
    title: "Custom Keyword Controls",
    description:
      "Set min/max keyword counts, filter out banned or trademarked terms, and inject custom keywords across batch sets.",
  },
  {
    icon: FolderOpen,
    title: "Batch Image Tagging",
    description:
      "Drop in entire photo sessions or illustration batches to generate thousands of tags automatically in minutes.",
  },
  {
    icon: Camera,
    title: "Photos, Vectors & Footage",
    description:
      "A single desktop tool generates accurate keyword sets across photography, vector illustrations, and video files.",
  },
  {
    icon: FileSpreadsheet,
    title: "Export to CSV or Embed",
    description:
      "Export agency CSV spreadsheets or write tags straight into file IPTC/XMP fields for effortless agency ingestion.",
  },
];

const FAQS = [
  {
    question: "How does the AI keyword generator create keywords from images?",
    answer:
      "GenMeta inspects image contents using state-of-the-art vision AI to identify subjects, colors, background elements, lighting, emotions, and conceptual themes, formatting them into ordered stock keywords.",
  },
  {
    question: "How many keywords does GenMeta generate per image?",
    answer:
      "By default, GenMeta generates 40 to 50 comprehensive, ordered keywords. You can customize the target keyword count to suit specific agency requirements.",
  },
  {
    question: "Why is keyword order important for stock photos?",
    answer:
      "Agencies like Adobe Stock prioritize the first 5 to 10 keywords in their search rankings. GenMeta ranks keywords logically with primary visual subjects at the top.",
  },
  {
    question: "Can I remove or add keywords before exporting?",
    answer:
      "Yes. GenMeta provides an interactive desktop review table where you can add, remove, reorder, or edit keywords before embedding or exporting.",
  },
];

export default async function AiStockKeywordGeneratorPage() {
  const releaseInfo = await getLatestRelease();

  return (
    <LandingPageLayout
      badge="Keywording Software"
      h1="AI Stock Keyword Generator"
      description="Turn your images into relevant stock keywords with AI. GenMeta analyzes your content and generates descriptive, organized keyword sets for microstock workflows in seconds."
      secondaryCopy="Say goodbye to blank-screen burnout. Generate 40-50 relevance-ordered keywords that help buyers discover your creative portfolio."
      breadcrumbName="Stock Keyword Generator"
      currentPath="/ai-stock-keyword-generator"
      downloadUrl={releaseInfo?.downloadUrl ?? "/download"}
      guidelinesTitle="Keywording Standards for Stock Content"
      guidelines={GUIDELINES}
      features={FEATURES}
      faqs={FAQS}
    />
  );
}
