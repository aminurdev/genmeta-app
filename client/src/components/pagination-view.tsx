"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";

import { usePagination } from "@/hooks/use-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  paginationItemsToDisplay?: number;
  handlePageChange: (page: number) => void;
  isLoading?: boolean;
  showJumpToPage?: boolean;
  showFirstLast?: boolean;
};

export default function PaginationView({
  currentPage,
  totalPages,
  paginationItemsToDisplay = 5,
  handlePageChange,
  isLoading = false,
  showJumpToPage,
  showFirstLast = true,
}: PaginationProps) {
  const [jumpInput, setJumpInput] = useState("");

  const {
    items,
    currentPage: safeCurrentPage,
    totalPages: safeTotalPages,
  } = usePagination({
    currentPage,
    totalPages,
    paginationItemsToDisplay,
  });

  const canGoPrev = safeCurrentPage > 1 && !isLoading;
  const canGoNext = safeCurrentPage < safeTotalPages && !isLoading;
  const shouldShowJump = showJumpToPage ?? safeTotalPages > 5;

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number.parseInt(jumpInput, 10);
    if (!Number.isFinite(parsed)) return;
    const target = Math.min(Math.max(1, parsed), safeTotalPages);
    if (target !== safeCurrentPage) {
      handlePageChange(target);
    }
    setJumpInput("");
  };

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5"
    >
      <div className="flex items-center gap-1">
        {showFirstLast && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden sm:inline-flex h-8 w-8"
            onClick={() => handlePageChange(1)}
            disabled={!canGoPrev}
            aria-label="Go to first page"
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2.5 gap-1 text-xs"
          onClick={() => handlePageChange(safeCurrentPage - 1)}
          disabled={!canGoPrev}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </Button>

        {/* Mobile Compact Page Indicator */}
        <span className="sm:hidden inline-flex items-center justify-center h-8 px-2.5 rounded-md border bg-muted/40 text-xs font-medium tabular-nums">
          Page {safeCurrentPage} / {safeTotalPages}
        </span>

        {/* Desktop Windowed Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {items.map((item) => {
            if (item === "ellipsis-left" || item === "ellipsis-right") {
              return (
                <span
                  key={item}
                  aria-hidden
                  className="flex h-8 w-7 items-center justify-center text-muted-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              );
            }

            const isActive = item === safeCurrentPage;
            return (
              <Button
                key={item}
                type="button"
                variant={isActive ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-8 w-8 text-xs tabular-nums",
                  isActive && "pointer-events-none"
                )}
                onClick={() => handlePageChange(item)}
                disabled={isLoading}
                aria-label={`Go to page ${item}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item}
              </Button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2.5 gap-1 text-xs"
          onClick={() => handlePageChange(safeCurrentPage + 1)}
          disabled={!canGoNext}
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {showFirstLast && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden sm:inline-flex h-8 w-8"
            onClick={() => handlePageChange(safeTotalPages)}
            disabled={!canGoNext}
            aria-label="Go to last page"
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {shouldShowJump && (
        <form
          onSubmit={handleJumpSubmit}
          className="flex items-center gap-1.5 pl-1"
        >
          <Input
            type="number"
            min={1}
            max={safeTotalPages}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            placeholder="Page"
            aria-label="Jump to page"
            disabled={isLoading}
            className="h-8 w-16 px-2 text-xs tabular-nums"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={isLoading || !jumpInput.trim()}
            className="h-8 px-2.5 text-xs"
          >
            Go
          </Button>
        </form>
      )}
    </nav>
  );
}
