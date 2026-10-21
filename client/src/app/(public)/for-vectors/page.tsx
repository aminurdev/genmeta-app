import { createMetadata } from "@/lib/seo";
import { getLatestRelease } from "@/lib/release-info";
import { LandingPageLayout } from "@/components/seo/LandingPageLayout";
import { FileSpreadsheet, FolderOpen, ListOrdered, PenTool, Sparkles, Tag } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "AI Metadata Generator for Stock Vectors — EPS & SVG Keywording | GenMeta",
  description:
    "Generate titles, descriptions, and keywords for vector illustrations, EPS artwork, and SVG icons with GenMeta. Identify styles, palettes, and commercial themes automatically.",
  path: "/for-vectors",
  keywords: [
    "vector metadata generator",
    "AI vector keyword generator",
    "stock vector keyword generator",
    "vector SEO keywords",
    "EPS metadata generator",
    "SVG metadata generator",
    "AI metadata generator for vectors",
    "stock illustration keyword generator",
  ],
});

const GUIDELINES = [
  {
    title: "Artistic Style Detection",
    detail:
      "Captures visual aesthetics including flat art, line art, isometric, vintage engraving, watercolor, 3D render, and paper cut-out styling.",
  },
  {
    title: "Commercial Use Themes",
    detail:
      "Tags conceptual and commercial context such as 'infographic banner', 'greeting card template', 'mobile app icon', or 'abstract background'.",
  },
  {
    title: "Color Palette & Elements",
    detail:
      "Extracts dominant color palettes (pastel, neon, monochrome) and structural elements ('isolated on transparent', 'seamless pattern').",
  },
];

const FEATURES = [
  {
    icon: PenTool,
    title: "Specialized Vector Analysis",
    description:
      "Trained on thousands of vector illustrations, clip art, and graphic patterns to produce keywords designers actually search for.",
  },
  {
    icon: Sparkles,
    title: "Style & Theme Identification",
    description:
      "Automatically identifies graphic design styles like isometric, minimalism, retro, and duotone without manual tagging.",
  },
  {
    icon: ListOrdered,
    title: "Relevance-Ranked Vector Keywords",
    description:
      "Orders tags logically so the core graphic subject is first, followed by style, color, format, and commercial applications.",
  },
  {
    icon: Tag,
    title: "SVG & EPS Compatibility",
    description:
      "Inspects SVG vectors and raster previews of EPS/AI files, generating matching metadata for cross-platform stock submission.",
  },
  {
    icon: FolderOpen,
    title: "Batch Keywording for Icon & Art Sets",
    description:
      "Process entire icon libraries, illustration packs, and graphic collections in minutes rather than spending days typing tags.",
  },
  {
    icon: FileSpreadsheet,
    title: "Cross-Agency CSV Export",
    description:
      "Export metadata in CSV formats tailored for Adobe Stock, Shutterstock, Freepik, and other leading microstock agencies.",
  },
];

const FAQS = [
  {
    question: "How does GenMeta handle EPS and SVG files?",
    answer:
      "GenMeta natively reads SVG files and raster preview renders generated alongside EPS files, accurately interpreting colors, shapes, typography, and illustration style.",
  },
  {
    question: "Can GenMeta recognize illustration styles like isometric or flat design?",
    answer:
      "Yes. The vision model identifies design movements and styles including isometric, flat design, line art, skeuomorphic, 3D render, pop art, and corporate Memphis.",
  },
  {
    question: "Does GenMeta generate tags for seamless patterns and backgrounds?",
    answer:
      "Yes. GenMeta detects repetitive patterns, wallpapers, geometric textures, and abstract backdrops, generating relevant terms like 'seamless pattern', 'tileable texture', and 'decorative wallpaper'.",
  },
  {
    question: "Can I prepare vector art for multiple stock sites at the same time?",
    answer:
      "Yes. GenMeta generates a single master metadata set that can be exported to multiple agency CSV formats with one click.",
  },
];

export default async function ForVectorsPage() {
  const releaseInfo = await getLatestRelease();

  return (
    <LandingPageLayout
      badge="Vector Contributor Tool"
      h1="AI Metadata Generator for Stock Vectors"
      description="Generate accurate titles, descriptions, and keywords for your vector illustrations, EPS artwork, and SVG designs in seconds. Stop manually describing every shape and layer."
      secondaryCopy="GenMeta identifies artistic styles, color palettes, and graphic concepts so your vectors get discovered by marketplace buyers."
      breadcrumbName="Vector Metadata"
      currentPath="/for-vectors"
      downloadUrl={releaseInfo?.downloadUrl ?? "/download"}
      guidelinesTitle="Stock Vector Keywording Best Practices"
      guidelines={GUIDELINES}
      features={FEATURES}
      faqs={FAQS}
    />
  );
}
