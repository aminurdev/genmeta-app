import { createMetadata } from "@/lib/seo";
import { getLatestRelease } from "@/lib/release-info";
import { LandingPageLayout } from "@/components/seo/LandingPageLayout";
import { FileSpreadsheet, FolderOpen, ListOrdered, Sparkles, Tag, Video } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "AI Metadata Generator for Stock Videos & Footage | GenMeta",
  description:
    "Generate titles, descriptions, and keywords for stock footage, B-roll, and 4K video clips with GenMeta. Tag camera motion, lighting, and concepts automatically.",
  path: "/for-stock-video",
  keywords: [
    "stock video metadata generator",
    "AI video keyword generator",
    "stock footage keyword generator",
    "AI stock video metadata",
    "stock video title generator",
    "stock footage metadata generator",
    "b-roll keyword generator",
  ],
});

const GUIDELINES = [
  {
    title: "Cinematography & Framing Tags",
    detail:
      "Stock buyers search for specific shot types: drone aerial, close-up, panning, slow motion, tilt, tracking shot, and time-lapse. GenMeta identifies and tags these cinematographic cues.",
  },
  {
    title: "Lighting & Atmosphere",
    detail:
      "Tags lighting conditions including golden hour, backlit, studio lighting, moody, high-key, and neon glow.",
  },
  {
    title: "Resolution & Technical Context",
    detail:
      "Supplements visual descriptions with appropriate technical tags (4K, Ultra HD, slow motion, 60fps) based on video attributes.",
  },
];

const FEATURES = [
  {
    icon: Video,
    title: "Motion & Footage Analysis",
    description:
      "Analyzes video frames to understand actions, camera movements, subject dynamics, and environmental context.",
  },
  {
    icon: Sparkles,
    title: "Accurate Video Titles",
    description:
      "Generates clear, descriptive footage titles such as 'Aerial view of city traffic at dusk with motion blur' without fluffy marketing jargon.",
  },
  {
    icon: ListOrdered,
    title: "Cinematic Keyword Sets",
    description:
      "Combines subject nouns with shot angles, camera motion, emotional tone, and commercial themes in prioritized order.",
  },
  {
    icon: FolderOpen,
    title: "Batch Keywording for Footage B-Roll",
    description:
      "Process entire filming sessions or B-roll folders in one pass without scrubbing and tagging each clip manually.",
  },
  {
    icon: FileSpreadsheet,
    title: "Agency-Ready CSV Export",
    description:
      "Export CSV spreadsheets formatted for Adobe Stock Video, Shutterstock Footage, Pond5, and Getty/iStock Video.",
  },
  {
    icon: Tag,
    title: "Local Desktop Video Processing",
    description:
      "Keep heavy multi-gigabyte video files on your local drives without waiting for massive cloud upload queues.",
  },
];

const FAQS = [
  {
    question: "How does GenMeta analyze video files without slow uploads?",
    answer:
      "GenMeta is a local desktop application that samples representative frames directly on your machine. Only lightweight thumbnail data is analyzed, allowing multi-gigabyte 4K clips to be tagged in seconds.",
  },
  {
    question: "Does GenMeta generate camera movement keywords?",
    answer:
      "Yes. GenMeta recognizes common camera movements such as aerial drone shots, pan, tilt, zoom, dolly, tracking, handheld, and static tripod setups.",
  },
  {
    question: "Can I export video metadata to Pond5 and Adobe Stock?",
    answer:
      "Yes. GenMeta exports CSV files compatible with major video marketplaces including Adobe Stock, Shutterstock, Pond5, and iStock.",
  },
  {
    question: "Which video formats does GenMeta support?",
    answer:
      "GenMeta supports standard video formats including MP4, MOV, and related preview video files.",
  },
];

export default async function ForStockVideoPage() {
  const releaseInfo = await getLatestRelease();

  return (
    <LandingPageLayout
      badge="Stock Footage Tool"
      h1="AI Metadata Generator for Stock Videos"
      description="Generate titles, descriptions, and keywords for your stock footage, drone shots, and B-roll clips in seconds. Eliminate hours of tedious video logging and keywording."
      secondaryCopy="GenMeta identifies camera movements, lighting, and subjects to prepare your video library for Adobe Stock, Shutterstock, Pond5, and more."
      breadcrumbName="Stock Video Metadata"
      currentPath="/for-stock-video"
      downloadUrl={releaseInfo?.downloadUrl ?? "/download"}
      guidelinesTitle="Stock Footage Keywording Best Practices"
      guidelines={GUIDELINES}
      features={FEATURES}
      faqs={FAQS}
    />
  );
}
