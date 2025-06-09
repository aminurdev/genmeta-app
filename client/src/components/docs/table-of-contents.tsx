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
  { id: "overview", title: "Overview", level: 1 },
  { id: "quick-example", title: "Quick Example", level: 1 },
  { id: "installation", title: "Installation", level: 1 },
  { id: "usage", title: "Usage", level: 1 },
  { id: "preview", title: "Preview", level: 2 },
  { id: "code", title: "Code", level: 2 },
  { id: "api-reference", title: "API Reference", level: 1 },
  { id: "card", title: "Card", level: 2 },
  { id: "card-header", title: "CardHeader", level: 2 },
  { id: "card-title", title: "CardTitle", level: 2 },
  { id: "card-description", title: "CardDescription", level: 2 },
  { id: "card-content", title: "CardContent", level: 2 },
  { id: "examples", title: "Examples", level: 1 },
  { id: "simple-card", title: "Simple Card", level: 2 },
  { id: "interactive-card", title: "Interactive Card", level: 2 },
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
