"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  HardDrive,
  ListOrdered,
  Lock,
  PenTool,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getFaqSchema } from "@/lib/seo";
import { cn } from "@/lib/utils";

interface Props {
  releaseInfo: {
    version: string;
    downloadUrl: string;
  } | null;
}

/* -------------------------------------------------------------------------- */
/*                                   Content                                  */
/* -------------------------------------------------------------------------- */

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Metadata Generator",
    description:
      "Generate titles, descriptions, keywords, and categories from your images, vectors, and videos using state-of-the-art vision models.",
    wide: true,
  },
  {
    icon: FolderOpen,
    title: "Bulk Metadata Generation",
    description:
      "Process large batches of hundreds or thousands of creative files in a single pass instead of writing metadata one file at a time.",
    wide: false,
  },
  {
    icon: ListOrdered,
    title: "Stock Photo Keyword Generator",
    description:
      "Create relevant, ordered keywords designed for stock content, placing critical marketplace search terms first.",
    wide: false,
  },
  {
    icon: PenTool,
    title: "Vector Metadata Generation",
    description:
      "Generate accurate tags and descriptions for vector illustrations, EPS and SVG artwork without manually describing every layer.",
    wide: false,
  },
  {
    icon: Video,
    title: "Stock Video Metadata",
    description:
      "Generate titles, descriptions, and keywords for your stock footage and video clips covering framing, motion, and resolution.",
    wide: false,
  },
  {
    icon: Tag,
    title: "Metadata Embedding",
    description:
      "Embed generated metadata directly into supported files via EXIF, IPTC and XMP so your titles and tags travel with your files.",
    wide: false,
  },
  {
    icon: SlidersHorizontal,
    title: "Custom AI Instructions",
    description:
      "Add your own prompts and rules to control keyword limits, exclude banned terms, and match your agency submission style.",
    wide: false,
  },
  {
    icon: FileSpreadsheet,
    title: "CSV & Agency Export",
    description:
      "Export agency-ready CSV spreadsheets formatted for Adobe Stock, Shutterstock, Freepik, Getty/iStock, and Alamy.",
    wide: false,
  },
];

const HOME_FAQS = [
  {
    question: "Why is GenMeta's metadata better than generic AI?",
    answer:
      "Generic AI chatbots flood files with hallucinated, spammy keywords that review teams reject and search algorithms bury. GenMeta is engineered specifically for stock marketplaces, producing clean, relevance-ranked metadata with top keywords in the first 5 to 10 positions where agencies look first.",
  },
  {
    question: "Can I use GenMeta for free?",
    answer:
      "Yes. GenMeta includes a free plan with 50 credits upon signup with no credit card required. You can process up to 25 files per day, inspect the quality, and export results before choosing an optional subscription or pay-as-you-go credit pack.",
  },
  {
    question: "Can AI generate Adobe Stock keywords with relevance ranking?",
    answer:
      "Yes. GenMeta arranges the most important keywords in the first 5 to 10 positions as required by Adobe Stock's search algorithm, and formats commercial titles within optimal length limits.",
  },
  {
    question: "Does GenMeta support vectors and stock videos?",
    answer:
      "Yes. GenMeta supports vector files including SVG and preview renders for EPS/AI files, as well as stock footage clips, generating precise style tags, color palettes, and motion keywords.",
  },
  {
    question: "Does GenMeta embed metadata into files or export CSV?",
    answer:
      "Both. GenMeta can embed titles, descriptions, and keywords directly into EXIF, IPTC, and XMP metadata fields within your files, or export agency-ready CSV spreadsheets formatted for major microstock platforms.",
  },
  {
    question: "Does GenMeta upload my original files to the cloud?",
    answer:
      "No. GenMeta runs locally as a Windows desktop application. Your high-resolution files stay securely on your computer. Only lightweight visual representations are processed for AI analysis, keeping your original catalog completely private.",
  },
];

const STEPS = [
  {
    title: "Install the desktop app",
    description: "A lightweight installer for Windows 10 and 11.",
  },
  {
    title: "Add your files",
    description: "Drag in a folder of images, videos or vectors.",
  },
  {
    title: "Generate metadata",
    description: "Titles, descriptions and keywords are written for every file.",
  },
  {
    title: "Review and export",
    description: "Edit anything inline, then export for your agency of choice.",
  },
];

const CREATORS = [
  {
    icon: Camera,
    title: "Photographers",
    description: "Tag full shoots in one pass instead of file by file.",
  },
  {
    icon: PenTool,
    title: "Illustrators",
    description: "Precise, searchable descriptions for vectors and icons.",
  },
  {
    icon: Video,
    title: "Videographers",
    description: "Descriptive metadata for footage and motion assets.",
  },
  {
    icon: FileText,
    title: "Studios",
    description: "Consistent metadata across large, multi-author catalogs.",
  },
];

const SAMPLE = {
  file: "watercolor-splash-0142.png",
  title:
    "Watercolor Splash Texture Background with Vibrant Blue and Purple Hues for Artistic Designs",
  description:
    "A vibrant watercolor splash texture blending blue and purple hues. Ideal for adding an artistic touch to digital art, graphic design and creative backgrounds.",
  keywords: [
    "watercolor",
    "splash",
    "texture",
    "background",
    "blue",
    "purple",
    "artistic",
    "abstract",
    "paint",
    "stain",
    "wash",
    "creative",
    "illustration",
    "backdrop",
  ],
  totalKeywords: 45,
};

const PLATFORMS = [
  "Adobe Stock",
  "Shutterstock",
  "Freepik",
  "Getty Images",
  "iStock",
  "Alamy",
  "Pond5",
  "Depositphotos",
];

function PlatformBrand({ name, className }: { name: string; className?: string }) {
  const baseSvg = "shrink-0 fill-current " + (className || "h-6 w-6");
  switch (name) {
    case "Adobe Stock":
      return (
        <svg viewBox="0 0 32 32" className={baseSvg} aria-hidden>
          <path d="M5.66667 0H26.3333C29.4667 0 32 2.53333 32 5.66667V25.5333C32 28.6667 29.4667 31.2 26.3333 31.2H5.66667C2.53333 31.2 0 28.6667 0 25.5333V5.66667C0 2.53333 2.53333 0 5.66667 0Z" />
          <path d="M11.8933 22.2667C11.16 22.28 10.4267 22.2 9.71999 22.0667C9.15999 21.96 8.59999 21.7867 8.07999 21.5467C7.95999 21.4934 7.90666 21.3734 7.90666 21.1867V18.6267C7.90666 18.5867 7.91999 18.5334 7.95999 18.5067C7.99999 18.48 8.05333 18.4934 8.09333 18.52C8.69333 18.8934 9.33333 19.1734 9.99999 19.36C10.64 19.5467 11.3067 19.64 11.9733 19.64C12.7867 19.64 13.3733 19.52 13.72 19.2667C14.04 19.0667 14.24 18.72 14.24 18.3334C14.24 18.1067 14.1867 17.88 14.0667 17.68C13.9067 17.4534 13.7067 17.2534 13.4667 17.1067C13.0933 16.88 12.6933 16.68 12.28 16.5334L11.2 16.08C10.3333 15.7067 9.63999 15.3067 9.14666 14.8934C8.69333 14.5334 8.34666 14.0667 8.13333 13.5334C7.94666 13.0267 7.85333 12.5067 7.85333 11.96C7.82666 10.4134 8.73333 8.98669 10.1467 8.36002C10.9067 8.00002 11.8533 7.81335 12.9867 7.81335C13.6267 7.81335 14.2667 7.85335 14.9067 7.94669C15.4 8.00002 15.88 8.14669 16.3333 8.36002C16.4267 8.41335 16.4933 8.52002 16.48 8.64002V11.0667C16.48 11.1067 16.4533 11.1334 16.4267 11.16C16.3867 11.2 16.3467 11.1867 16.2933 11.1467C15.8133 10.9067 15.3067 10.72 14.7867 10.6134C14.2 10.48 13.6 10.4134 13 10.4267C12.64 10.4267 12.2933 10.4534 11.9467 10.5334C11.7067 10.5867 11.4667 10.68 11.2533 10.8C11.08 10.8934 10.9467 11.04 10.8533 11.2134C10.7733 11.3734 10.72 11.5467 10.72 11.72C10.72 11.9334 10.7867 12.16 10.9067 12.3334C11.08 12.56 11.3067 12.7334 11.5467 12.8667C11.9467 13.0934 12.36 13.3067 12.7867 13.4934L13.5867 13.8C14.5333 14.1867 15.2667 14.6 15.8 15.04C16.28 15.4134 16.6667 15.9067 16.92 16.4534C17.1333 16.9734 17.24 17.5334 17.24 18.0934C17.2533 18.8934 17.0133 19.6667 16.56 20.32C16.08 20.9734 15.4267 21.48 14.68 21.7867C13.9333 22.0934 12.9867 22.2667 11.8933 22.2667Z" />
          <path d="M24.52 19.92V21.68C24.52 21.84 24.4667 21.9333 24.3467 21.96C24.0667 22.0533 23.7733 22.12 23.4933 22.1733C23.1467 22.24 22.8133 22.2667 22.4667 22.2533C21.5333 22.2533 20.8 22.0133 20.28 21.52C19.76 21.0267 19.48 20.2533 19.48 19.1867V13.84H18.1867C18.0667 13.84 18.0133 13.7733 18.0133 13.6533L18.0267 11.5333C18.0267 11.4133 18.0933 11.36 18.2133 11.36H19.5067C19.52 11.12 19.52 10.8533 19.5467 10.5333C19.5733 10.2133 19.6 9.89332 19.6267 9.57332C19.6533 9.25332 19.6933 8.98665 19.72 8.78665C19.7333 8.74665 19.76 8.70665 19.7867 8.66665C19.8133 8.62665 19.8533 8.59999 19.8933 8.58665L22.4533 8.26665C22.4933 8.25332 22.52 8.25332 22.56 8.26665C22.5867 8.27999 22.6 8.31999 22.6 8.39999C22.5733 8.73332 22.5467 9.17332 22.5333 9.74665C22.52 10.3067 22.52 10.84 22.5067 11.3733H24.4C24.48 11.3733 24.5333 11.4267 24.5333 11.5467L24.52 13.7067C24.5333 13.7733 24.48 13.84 24.4133 13.8533H22.52V18.48C22.52 18.96 22.5733 19.32 22.7333 19.52C22.8933 19.72 23.2 19.8267 23.64 19.8267C23.7733 19.8267 23.8933 19.8267 24 19.8133C24.1067 19.8 24.2267 19.8 24.3467 19.7867C24.3867 19.7733 24.4267 19.7733 24.4667 19.8C24.5067 19.8133 24.52 19.8533 24.52 19.92Z" />
        </svg>
      );
    case "Shutterstock":
      return (
        <svg viewBox="0 0 32 32" className={baseSvg} aria-hidden>
          <path d="M18.699 7.549h-6.636c0 0 0 0 0 0-1.055 0-1.91 0.854-1.912 1.908v7.199h-6.542v-7.199c0-0 0-0.001 0-0.001 0-4.668 3.784-8.451 8.451-8.451 0.001 0 0.002 0 0.003 0h6.635zM13.3 24.449h6.639c1.053-0.002 1.907-0.856 1.908-1.909v-7.198h6.544v7.198c0 4.669-3.784 8.454-8.452 8.456h-6.64v-6.547z" />
        </svg>
      );
    case "Freepik":
      return (
        <svg viewBox="0 0 24 24" className={baseSvg} aria-hidden>
          <path d="M4.315 6.939c-.702.702-1.204 1.505-1.706 2.308l-.702-.402c-.1-.401-.602-.702-1.004-.702-.602.1-.903.502-.903 1.104 0 .501.502.903 1.004.803.1 0 .2 0 .3-.1l.703.4c-.401.904-.702 1.807-.803 2.81l1.204.201c.402-2.107 1.305-4.014 2.81-5.52Zm12.544 7.626c-1.204 0-2.107-1.003-2.107-2.107 0-1.204 1.004-2.107 2.107-2.107 1.205 0 2.108 1.003 2.108 2.107 0 1.204-.903 2.107-2.108 2.107zm-7.325 1.506a2.912 2.912 0 0 1-2.91-2.91c0-1.707 1.304-3.011 2.91-3.011a2.912 2.912 0 0 1 2.91 2.91c0 1.606-1.305 3.01-2.91 3.01zm3.311-10.337a9.422 9.422 0 0 0-9.433 9.434c0 .702.1 1.304.2 2.007 1.004.802 4.216 1.405 8.33 1.204 4.516-.301 8.23-1.505 10.437-3.412 0-.301 0-.602-.1-.903-.603-4.817-4.617-8.33-9.434-8.33Zm-.803 13.749c-.602 0-1.204.1-1.806.1-1.405 0-2.71-.1-3.914-.3-.602-.101-1.304-.302-2.007-.503 1.606 2.91 4.817 4.918 8.43 4.918 4.415 0 8.229-3.011 9.232-7.125a16.828 16.828 0 0 1-3.813 1.806c-1.806.602-3.914 1.003-6.122 1.104zM23.182 7.34c.501-.1.903-.502.803-1.104-.1-.502-.502-.903-1.004-.803-.502.1-.803.502-.803 1.004l-.702.602c-.703-.703-1.405-1.305-2.208-1.806l-.602 1.003a11.225 11.225 0 0 1 4.014 4.616l1.104-.501c-.402-.904-.903-1.706-1.505-2.51l.602-.601c.1.1.2.1.3.1zM12.845 3.326h-.803l-.1-1.004c.301-.2.502-.602.401-1.003-.1-.602-.602-1.104-1.204-1.004-.602.1-1.003.602-1.003 1.305.1.401.3.702.602.903l.1 1.004c-1.104.2-2.208.501-3.211 1.003l.502 1.104a10.425 10.425 0 0 1 4.616-1.104c.803 0 1.505.1 2.308.301l.2-1.204c-.702-.2-1.505-.301-2.408-.301Z" />
        </svg>
      );
    case "Getty Images":
      return (
        <svg viewBox="0 0 98 97" className={baseSvg} aria-hidden>
          <path d="M39.61 64.18c0 2.848 2.575 4.13 10.45 4.13 6.058 0 8.102-2.849 8.102-4.13 0-1.711-2.8-4.276-11.888-4.276-5.15 0-6.664 2.708-6.664 4.275zM48.016 29.414c-4.013 0-6.816 2.706-6.816 6.126s2.803 6.127 6.816 6.127c3.558 0 6.436-2.706 6.436-6.127s-2.878-6.126-6.436-6.126z" />
          <path d="M49-.25C22.076-.25.25 21.576.25 48.5S22.076 97.25 49 97.25 97.75 75.424 97.75 48.5 75.924-.25 49-.25zm18.022 29.094c-2.196 0-4.619 0-6.057.855 1.21 1.567 2.12 3.705 2.12 6.554 0 6.98-4.999 11.968-14.843 11.968-4.088 0-7.344.143-7.344 2.28 0 5.985 25.898-2.137 25.898 12.68 0 5.273-5.68 10.971-18.25 10.971-10.602 0-17.568-2.99-17.568-8.832 0-4.632 3.71-6.84 7.118-6.84v-.143c-1.818-1.068-5.831-1.994-5.831-5.984 0-3.562 4.393-6.268 6.134-6.767-3.256-2.494-5.83-5.343-5.83-9.832 0-6.483 5.3-12.894 15.523-12.894 3.332 0 7.27 1.282 9.692 3.277 1.817-2.28 4.77-3.42 9.238-3.277v5.984z" />
        </svg>
      );
    case "iStock":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`shrink-0 ${className || "h-6 w-6"}`} aria-hidden>
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      );
    case "Alamy":
      return (
        <svg viewBox="0 0 24 24" className={baseSvg} aria-hidden>
          <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Zm.058-18.533c2.515 0 3.482 1.404 3.482 3.959v7.04c0 .78 0 1.21.193 1.872H13.47c-.406-.331-.503-1.072-.503-1.423-.464 1.111-1.102 1.618-2.224 1.618-1.354 0-2.476-1.014-2.476-3.257 0-2.626 1.618-3.566 2.956-4.343.937-.545 1.736-1.009 1.744-1.917 0-.858-.29-1.15-.909-1.15-.696 0-.987.468-.987 1.56v.429H8.5v-.37c0-2.614 1.006-4.018 3.559-4.018Zm-.213 10.667c.6 0 .948-.526 1.122-.8v-3.393c-.209.345-.544.621-.887.904-.608.5-1.24 1.023-1.24 1.983 0 .838.367 1.306 1.005 1.306Z" />
        </svg>
      );
    case "Pond5":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`shrink-0 ${className || "h-6 w-6"}`} aria-hidden>
          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" />
          <rect x="3" y="6" width="12" height="12" rx="2" />
        </svg>
      );
    case "Depositphotos":
      return (
        <svg viewBox="0 0 24 24" className={baseSvg} aria-hidden>
          <path d="M12 24c5.119 0 9.061-3.942 9.061-9.06S17.119 5.88 12 5.88c-5.117 0-9.059 3.942-9.059 9.06S6.883 24 12 24Zm0-5.598c-1.954 0-3.461-1.508-3.461-3.462 0-1.955 1.507-3.462 3.461-3.462 1.955 0 3.462 1.507 3.462 3.462 0 1.954-1.507 3.462-3.462 3.462Zm2.634-12.241h6.161V0h-6.161v6.161Z" />
        </svg>
      );
    default:
      return null;
  }
}


/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default function HomePage({ releaseInfo }: Props) {
  const downloadUrl = releaseInfo?.downloadUrl ?? "/download";
  const version = releaseInfo?.version;
  const isExternal = downloadUrl.startsWith("http");

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-[1300px] md:border-x">
        {/* ------------------------------ Hero ------------------------------ */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="lp-grid-bg pointer-events-none absolute inset-0"
          />

          <div className="relative px-6 pb-16 pt-16 md:px-12 md:pb-20 md:pt-24">
            {version && (
              <Link
                href="/download"
                className="lp-rise group mb-8 inline-flex items-center gap-2 rounded-full border bg-background py-1 pl-1 pr-3 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                <span className="rounded-full bg-foreground px-2 py-0.5 font-medium text-background">
                  New
                </span>
                <span>
                  GenMeta <span className="font-mono">v{version}</span> is
                  available
                </span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}

            <h1
              className="lp-rise max-w-3xl text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl md:text-6xl md:leading-[1.05]"
              style={{ animationDelay: "60ms" }}
            >
              AI Metadata for Your Stock Content
            </h1>

            <p
              className="lp-rise mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg"
              style={{ animationDelay: "120ms" }}
            >
              GenMeta generates relevance-ranked titles, descriptions, and keywords for your photos, videos, and vectors optimized for Adobe Stock, Shutterstock, Freepik, and more.

            </p>

            <div
              className="lp-rise mt-10 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "180ms" }}
            >
              <Button
                asChild
                size="lg"
                className="h-11 gap-2 rounded-full px-6"
              >
                <a
                  href={downloadUrl}
                  {...(isExternal
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <WindowsIcon className="h-4 w-4" />
                  Download Free for Windows
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 rounded-full px-6"
              >
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>

            <p
              className="lp-rise mt-6 font-mono text-xs text-muted-foreground"
              style={{ animationDelay: "240ms" }}
            >
              Windows 10/11 · Free Plan Available · No Credit Card Required
            </p>
          </div>

          {/* Product shot */}
          <div className="relative px-4 pb-4 md:px-12 md:pb-12">
            <div className="rounded-xl border bg-muted/50 p-1.5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] md:p-2 dark:shadow-none">
              <div className="overflow-hidden rounded-lg border bg-background">
                <Image
                  src="/Assets/app-light.png"
                  alt="GenMeta desktop app showing generated titles, descriptions and keywords"
                  width={2000}
                  height={1200}
                  priority
                  className="h-auto w-full dark:hidden"
                />
                <Image
                  src="/Assets/app-dark.png"
                  alt="GenMeta desktop app showing generated titles, descriptions and keywords"
                  width={2000}
                  height={1200}
                  priority
                  className="hidden h-auto w-full dark:block"
                />
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------- Platforms ---------------------------- */}
        <Section>
          <div className="overflow-hidden">
            <div className="border-b px-6 py-4 text-sm text-muted-foreground md:px-12">
              Formatted for major stock marketplaces
            </div>
            <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="flex animate-[ticker_28s_linear_infinite] shrink-0">
                {[...PLATFORMS, ...PLATFORMS].map((name, i) => (
                  <div
                    key={`a-${i}`}
                    className="flex shrink-0 items-center justify-center gap-3 border-r px-8 py-6 text-base font-semibold tracking-tight text-foreground/60 hover:text-foreground transition-colors whitespace-nowrap md:px-12 md:text-lg"
                  >
                    <PlatformBrand name={name} className="h-5 w-5" />
                    {name}
                  </div>
                ))}
              </div>
              <div
                aria-hidden
                className="flex animate-[ticker_28s_linear_infinite] shrink-0"
              >
                {[...PLATFORMS, ...PLATFORMS].map((name, i) => (
                  <div
                    key={`b-${i}`}
                    className="flex shrink-0 items-center justify-center gap-3 border-r px-8 py-6 text-base font-semibold tracking-tight text-foreground/60 hover:text-foreground transition-colors whitespace-nowrap md:px-12 md:text-lg"
                  >
                    <PlatformBrand name={name} className="h-5 w-5" />
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>



        {/* ---------------------------- Features (Bento) -------------------- */}
        <Section id="features">
          <SectionHeader
            eyebrow="Features"
            title="Everything between export and upload."
            description="GenMeta replaces the spreadsheet, the keyword tool and the manual copy-paste with a single desktop app."
          />

          {/* Bento grid — 8 SEO features */}
          <div className="grid gap-px border-t bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon, title, description, wide }) => (
              <BentoCell
                key={title}
                icon={icon}
                title={title}
                description={description}
                className={wide ? "lg:col-span-2" : undefined}
                highlight={wide}
              />
            ))}
          </div>
        </Section>

        {/* ---------------------------- Workflow ---------------------------- */}
        <Section id="how-it-works">
          <div className="grid lg:grid-cols-2">
            <div className="border-b px-6 py-14 md:px-12 md:py-20 lg:border-b-0 lg:border-r">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                How it works
              </p>
              <h2 className="mt-4 max-w-md text-balance text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                From folder to CSV in four steps.
              </h2>

              <ol className="mt-10 space-y-0">
                {STEPS.map((step, i) => (
                  <li
                    key={step.title}
                    className="relative flex gap-5 pb-8 last:pb-0"
                  >
                    {i < STEPS.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute left-[13px] top-8 h-[calc(100%-2rem)] w-px bg-border"
                      />
                    )}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background font-mono text-[11px] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="pt-0.5">
                      <h3 className="text-[15px] font-medium tracking-tight">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-center bg-muted/30 px-4 py-14 md:px-12 md:py-20">
              <OutputPanel />
            </div>
          </div>
        </Section>

        {/* -------------------- Section 14: Privacy Section ----------------- */}
        <Section id="privacy">
          <div className="grid lg:grid-cols-2">
            <div className="border-b px-6 py-14 md:px-12 md:py-20 lg:border-b-0 lg:border-r">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Privacy & Desktop Control
              </p>
              <h2 className="mt-4 max-w-lg text-balance text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                Your Files Stay on Your Computer.
              </h2>
              <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground">
                GenMeta is built as a desktop application, giving creators more
                control over their workflow. Your original creative files can
                remain on your computer while you generate and manage metadata.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Unlike web browser tools that require uploading gigabytes of
                creative assets over slow connections, GenMeta processes files
                locally on your machine and communicates only lightweight visual
                data for AI analysis.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-5 bg-muted/20 p-6 md:p-12">
              <div className="flex gap-4 rounded-xl border bg-background p-5">
                <Lock className="h-6 w-6 shrink-0 text-foreground" />
                <div>
                  <h3 className="text-base font-medium">Local-First Desktop App</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your full-resolution images, RAW captures, vectors, and master
                    videos are never uploaded to remote storage.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border bg-background p-5">
                <HardDrive className="h-6 w-6 shrink-0 text-foreground" />
                <div>
                  <h3 className="text-base font-medium">Fast Folder Batch Scanning</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Scan thousands of creative files directly from your SSD or
                    external drive with zero bandwidth bottlenecks.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border bg-background p-5">
                <ShieldCheck className="h-6 w-6 shrink-0 text-foreground" />
                <div>
                  <h3 className="text-base font-medium">Direct Metadata Embedding</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Embed EXIF, IPTC and XMP tags directly to your local files so
                    metadata stays attached wherever your assets travel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ------------------- Better Metadata & Free Plan ------------------- */}
        <Section id="overview">
          <div className="px-6 py-14 md:px-12 md:py-20">
            <div className="max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Engineered for Contributor Success
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
                Better Metadata. Higher Acceptance. Free to Start.
              </h2>
              <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                Nobody keywords manually anymore — but generic AI tools flood
                your files with hallucinated, spammy tags that review teams
                reject and search algorithms bury. GenMeta is built specifically
                for microstock marketplaces, producing cleaner, relevance-ranked
                metadata that helps buyers find your content.
              </p>
              <p className="mt-4 text-pretty text-base font-medium text-foreground">
                Start completely free. Download for Windows and get 50 free credits
                instantly — no credit card required.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl border bg-background p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/40 font-mono text-sm font-semibold">
                  01
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight">
                  True Relevance Ranking
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Agencies like Adobe Stock prioritize the first 5 to 10 keywords.
                  GenMeta puts primary subjects first instead of random or
                  alphabetized filler.
                </p>
              </div>

              <div className="rounded-xl border bg-background p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/40 font-mono text-sm font-semibold">
                  02
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight">
                  Zero Hallucinations & Spam
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Trained on stock visual criteria to tag genuine subjects,
                  styles, and moods without adding irrelevant terms that cause
                  review rejections.
                </p>
              </div>

              <div className="rounded-xl border bg-background p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/40 font-mono text-sm font-semibold">
                  03
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight">
                  Multi-Agency CSV & Embed
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Prepare assets simultaneously for Adobe Stock, Shutterstock,
                  Freepik, and major microstock distributors in their required
                  formats.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ---------------------------- Creators ---------------------------- */}
        <Section>
          <SectionHeader
            eyebrow="Who it's for"
            title="Built for people who upload every week."
          />
          <div className="grid gap-px border-t bg-border sm:grid-cols-2 lg:grid-cols-4">
            {CREATORS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-background p-6 md:p-10">
                <Icon
                  className="h-5 w-5 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <h3 className="mt-5 text-[15px] font-medium tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ------------------------------- FAQ ------------------------------ */}
        <Section id="faq">
          <div className="grid lg:grid-cols-2">
            <div className="border-b px-6 py-14 md:px-12 md:py-20 lg:border-b-0 lg:border-r">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                FAQ
              </p>
              <h2 className="mt-4 max-w-md text-balance text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                Questions about AI metadata.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Can&apos;t find what you need?{" "}
                <Link
                  href="/contact"
                  className="text-foreground underline underline-offset-4"
                >
                  Contact us
                </Link>
                .
              </p>
            </div>
            <div className="bg-muted/30 px-6 py-10 md:px-12 md:py-16">
              <Accordion type="single" collapsible className="w-full">
                {HOME_FAQS.map((item, i) => (
                  <AccordionItem key={item.question} value={`item-${i}`}>
                    <AccordionTrigger className="py-4 text-left text-[15px] font-medium tracking-tight hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(getFaqSchema(HOME_FAQS)),
            }}
          />
        </Section>

        {/* ------------------------------- CTA ------------------------------ */}
        <Section className="overflow-hidden">
          <div
            aria-hidden
            className="lp-grid-bg pointer-events-none absolute inset-0 opacity-70"
          />
          <div className="relative flex flex-col items-start justify-between gap-8 px-6 py-16 md:flex-row md:items-end md:px-12 md:py-24">
            <div>
              <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
                Boost Your Microstock Sales with AI Powered Metadata.
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Start on the free plan. Upgrade when you need unlimited
                processing and every export format.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-11 gap-2 rounded-full px-6"
              >
                <a
                  href={downloadUrl}
                  {...(isExternal
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <WindowsIcon className="h-4 w-4" />
                  Download free
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 gap-1 rounded-full px-6"
              >
                <Link href="/pricing">
                  Compare plans
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Primitives                                 */
/* -------------------------------------------------------------------------- */

function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("relative border-t", className)}>
      <span aria-hidden className="lp-cross -left-[7px] -top-[7px] z-10 hidden md:block" />
      <span aria-hidden className="lp-cross -right-[7px] -top-[7px] z-10 hidden md:block" />
      {children}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="grid gap-6 px-6 py-14 md:grid-cols-2 md:items-end md:px-12 md:py-20">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-4 max-w-lg text-balance text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
          {title}
        </h2>
      </div>
      {description && (
        <p className="max-w-md text-pretty leading-relaxed text-muted-foreground md:justify-self-end">
          {description}
        </p>
      )}
    </div>
  );
}

function OutputPanel() {
  const remaining = SAMPLE.totalKeywords - SAMPLE.keywords.length;

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-background text-sm shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] dark:shadow-none">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <span className="truncate font-mono text-xs text-muted-foreground">
            {SAMPLE.file}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Generated
        </span>
      </div>

      <dl className="divide-y">
        <Field label="Title" meta={`${SAMPLE.title.length} chars`}>
          <p className="font-medium leading-snug">{SAMPLE.title}</p>
        </Field>
        <Field label="Description" meta={`${SAMPLE.description.length} chars`}>
          <p className="leading-relaxed text-muted-foreground">
            {SAMPLE.description}
          </p>
        </Field>
        <Field label="Keywords" meta={`${SAMPLE.totalKeywords} keywords`}>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE.keywords.map((k) => (
              <span
                key={k}
                className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs"
              >
                {k}
              </span>
            ))}
            <span className="px-1 py-0.5 font-mono text-xs text-muted-foreground">
              +{remaining}
            </span>
          </div>
        </Field>
      </dl>

      <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-3">
        <span className="font-mono text-xs text-muted-foreground">
          adobe-stock.csv
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Export
        </span>
      </div>
    </div>
  );
}

function Field({
  label,
  meta,
  children,
}: {
  label: string;
  meta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-4">
      <div className="mb-2 flex items-center justify-between">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <span className="font-mono text-[11px] text-muted-foreground/80">
          {meta}
        </span>
      </div>
      <dd>{children}</dd>
    </div>
  );
}

/** Individual bento grid cell */
function BentoCell({
  icon: Icon,
  title,
  description,
  className,
  highlight,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 bg-background p-6 transition-colors hover:bg-muted/40 md:p-10",
        className
      )}
    >
      {highlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/[0.03] to-transparent"
        />
      )}
      <Icon
        className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground"
        strokeWidth={1.5}
      />
      <div>
        <h3 className="text-[15px] font-medium tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M3 5.1 10.4 4v7.2H3V5.1Zm0 13.8 7.4 1.1v-7.1H3v6Zm8.2 1.2L21 21.5V12.9h-9.8v7.2Zm0-16.2v7.3H21V2.5l-9.8 1.4Z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Footer                                   */
/* -------------------------------------------------------------------------- */

const FOOTER_LINKS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { href: "/download", label: "Download for Windows" },
      { href: "/pricing", label: "Pricing & Plans" },
      { href: "/docs", label: "Documentation" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    heading: "Marketplaces",
    links: [
      { href: "/for-adobe-stock", label: "Adobe Stock Metadata" },
      { href: "/for-shutterstock", label: "Shutterstock Metadata" },
      { href: "/for-freepik", label: "Freepik Metadata" },
      { href: "/microstock-metadata-generator", label: "Microstock Creators" },
    ],
  },
  {
    heading: "Solutions",
    links: [
      { href: "/ai-metadata-generator", label: "AI Metadata Generator" },
      { href: "/ai-stock-keyword-generator", label: "Stock Keyword Generator" },
      { href: "/for-vectors", label: "Vector Metadata" },
      { href: "/for-stock-video", label: "Stock Video Metadata" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact & Support" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/refund-policy", label: "Refund Policy" },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-[1300px] px-6 py-14 md:border-x md:px-12">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-6">
          <div className="sm:col-span-2 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80">
              <svg viewBox="0 0 106.37 106.37" className="h-8 w-8 shrink-0" aria-hidden>
                <defs>
                  <linearGradient id="ft-lg" x1="9.2" y1="8.82" x2="35.33" y2="35.93" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#2563ec" />
                    <stop offset="1" stopColor="#2563ec" />
                  </linearGradient>
                  <linearGradient id="ft-lg2" x1="25.35" y1="-6.74" x2="51.48" y2="20.36" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#2563ec" />
                    <stop offset="1" stopColor="#2563ec" />
                  </linearGradient>
                  <linearGradient id="ft-lg3" x1="-6.35" y1="23.82" x2="19.78" y2="50.92" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#2563ec" />
                    <stop offset="1" stopColor="#2563ec" />
                  </linearGradient>
                </defs>
                <path fill="#a3b4d2" d="M68.41,27.77c3.3.66,7.01,2.53,9.71,5.17,2.7,2.64,4.4,6.06,3.69,9.8-.37,1.48-1.43,2.83-2.68,4.11-1.25,1.28-2.69,2.49-3.83,3.68-.73.8-2,1.88-3,2.99-1,1.11-1.74,2.26-1.4,3.2.19.56.6,1.06,1.1,1.42s1.11.6,1.71.65c1.58.12,3.31-1.47,5.01-3.28s3.35-3.84,4.77-4.59c2.15-1.26,3.78-.39,5.05,1.19,1.27,1.57,2.19,3.84,2.92,5.37.62,1.35,1.22,2.72,1.82,4.1.59,1.37,1.17,2.75,1.75,4.13,1.08,2.62,2.21,5.2,3.36,7.76,1.15,2.56,2.33,5.11,3.51,7.7,1.12,2.63,2.5,5.43,3.43,8.3.93,2.87,1.41,5.82.71,8.74-.82,3.58-3.29,6.03-6.35,7.26-3.07,1.23-6.73,1.23-9.93-.07-1.28-.57-3.6-1.62-6.28-2.82-2.68-1.2-5.72-2.57-8.41-3.78-1.35-.61-2.6-1.17-3.69-1.66-1.08-.49-1.99-.9-2.64-1.19-.52-.2-.98-.5-1.32-.9s-.57-.89-.62-1.47c-.11-.66.05-1.37.36-2.03s.78-1.28,1.28-1.76c1.13-1.17,2.64-2.49,3.84-3.82,1.21-1.33,2.12-2.67,2.07-3.89,0-.68-.32-1.28-.8-1.72s-1.12-.7-1.79-.69c-1.28.07-2.34.8-3.32,1.73s-1.86,2.07-2.78,2.95c-.9.94-1.79,1.91-2.74,2.8-.95.9-1.95,1.72-3.08,2.35-1.22.69-2.51.78-3.82.56s-2.66-.75-4-1.31c-1.67-.7-3.36-1.5-5.05-2.32s-3.36-1.67-5.01-2.49c-1.87-.86-3.14-2.09-3.6-3.53-.46-1.44-.12-3.09,1.24-4.78,1.11-1.4,2.53-2.71,3.97-4.02,1.44-1.31,2.9-2.61,4.09-3.98.84-.85,1.38-2.03,1.38-3.08,0-1.05-.53-1.98-1.87-2.33-.74-.19-1.53-.02-2.29.35-.75.37-1.47.93-2.04,1.5-1.14,1.1-2.3,2.41-3.46,3.67s-2.33,2.48-3.49,3.42c-1.6,1.34-3.16,1.78-4.49,1.39-1.33-.39-2.43-1.62-3.1-3.64-2.54-7.01-.59-12.64,3.09-17.67,3.69-5.02,9.12-9.43,13.55-13.96,3.18-4.07,6.45-6.98,10.21-8.61,3.76-1.63,8.02-1.97,13.15-.9h.04Z" />
                <path fill="url(#ft-lg)" d="M28.9,11.18c-.68-1.06-1.47-2.08-2.39-2.95-.92-.87-1.97-1.58-3.2-2.03-2.51-1.13-5.34-1.33-7.98-.74-2.65.59-5.11,1.97-6.9,4.01l-.03.03-.03.03c-1.82,2.16-2.9,4.95-3.1,7.78s.47,5.7,2.15,8.02c.78,1.15,1.71,2.02,2.74,2.77s2.17,1.4,3.35,2.08c2.13,1.22,4.73,2.59,7.23,3.84s4.9,2.37,6.65,3.09c.73.3,1.46.55,2.22.73s1.52.28,2.34.28c1.8.06,3.36-.54,4.48-1.61,1.11-1.07,1.78-2.61,1.77-4.42.01-1.05-.15-2.08-.43-3.08-.27-1.01-.65-1.99-1.06-2.94-1.08-2.38-2.27-5.03-3.57-7.62-1.3-2.59-2.72-5.12-4.24-7.28Z" />
                <path fill="url(#ft-lg2)" d="M51.64,7.73c-.35-2.58-1.74-4.7-3.67-6.07-1.93-1.36-4.39-1.97-6.87-1.5-2.38.31-4.55,1.66-5.94,3.53-1.39,1.87-2.02,4.25-1.31,6.63.4,1.42.94,2.85,1.53,4.27s1.24,2.83,1.87,4.18c.53,1.05,1.02,2.13,1.57,3.13s1.17,1.92,1.96,2.65c1.18,1.17,2.66,1.43,4.02,1.06,1.36-.37,2.6-1.38,3.31-2.73.66-1.32,1.25-3.06,1.73-4.82.49-1.76.87-3.55,1.12-4.95v-.04Z" />
                <path fill="url(#ft-lg3)" d="M20.51,37.75c-1.22-.6-2.59-1.25-3.96-1.87s-2.74-1.18-3.98-1.62c-2.42-.96-4.98-.95-7.16-.06-2.18.89-3.98,2.65-4.88,5.17-1.06,2.7-.45,5.76,1.15,8.12,1.61,2.35,4.21,4,7.15,3.85h.04c1.16-.1,2.24-.26,3.33-.46,1.1-.2,2.21-.42,3.42-.65,1.64-.43,3.48-.76,5.17-1.32,1.69-.56,3.24-1.35,4.31-2.7.46-.63.71-1.42.75-2.23.04-.81-.12-1.65-.47-2.39-.47-1-1.23-1.72-2.11-2.32s-1.87-1.06-2.8-1.54Z" />
              </svg>
              <span className="text-base font-semibold tracking-[-0.03em]">GenMeta</span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI metadata generation for microstock contributors. Built for
              Windows.
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <a
                href="mailto:support@genmeta.app"
                className="block text-muted-foreground transition-colors hover:text-foreground"
              >
                support@genmeta.app
              </a>
              <a
                href="https://wa.me/8801817710493"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                WhatsApp support
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h4 className="text-sm font-medium">{group.heading}</h4>
              <ul className="mt-4 space-y-3 text-sm">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col-reverse items-start justify-between gap-6 border-t pt-8 md:flex-row md:items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} GenMeta Technologies. All rights
            reserved.
          </p>
          <div className="w-full max-w-[260px] opacity-80">
            <Image
              src="/Assets/Payment Gateway Dark.png"
              alt="Supported payment methods"
              width={300}
              height={60}
              className="h-auto w-full dark:hidden"
            />
            <Image
              src="/Assets/Payment Gateway Light.png"
              alt="Supported payment methods"
              width={300}
              height={60}
              className="hidden h-auto w-full dark:block"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
