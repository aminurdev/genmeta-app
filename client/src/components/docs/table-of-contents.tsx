"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TocItem {
  id: string
  title: string
  level: number
}

const tocItems: TocItem[] = [
  { id: "introduction", title: "Introduction", level: 1 },
  { id: "what-is-genmeta", title: "What is GenMeta?", level: 2 },
  { id: "key-features", title: "Key Features", level: 2 },
  { id: "installation", title: "Installation", level: 1 },
  { id: "system-requirements", title: "System Requirements", level: 2 },
  { id: "download-install", title: "Download & Install", level: 2 },
  { id: "setup", title: "Setup", level: 1 },
  { id: "api-key-setup", title: "API Key Setup", level: 2 },
  { id: "first-run", title: "First Run", level: 2 },
  { id: "quick-start", title: "Quick Start", level: 1 },
  { id: "single-image", title: "Single Image Processing", level: 2 },
  { id: "batch-processing", title: "Batch Processing", level: 2 },
  { id: "ai-metadata", title: "AI Metadata Generation", level: 1 },
  { id: "export-options", title: "Export Options", level: 1 },
  { id: "troubleshooting", title: "Troubleshooting", level: 1 },
]

export function TableOfContents() {
  const [activeId, setActiveId] = React.useState<string>("")

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: "-20% 0% -35% 0%",
      },
    )

    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    headings.forEach((heading) => {
      if (heading.id) {
        observer.observe(heading)
      }
    })

    return () => {
      headings.forEach((heading) => {
        if (heading.id) {
          observer.unobserve(heading)
        }
      })
    }
  }, [])

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  return (
    <div className="sticky top-16 h-[calc(100vh-4rem)] py-6 px-4">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">On This Page</h4>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="space-y-1">
            {tocItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={cn(
                  "block w-full text-left text-sm transition-colors hover:text-foreground",
                  item.level === 1 ? "font-medium" : "text-muted-foreground pl-4",
                  activeId === item.id ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {item.title}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
