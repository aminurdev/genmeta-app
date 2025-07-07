"use client";

import { usePagination } from "@/hooks/use-pagination";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  paginationItemsToDisplay?: number;
  handlePageChange: (page: number) => void;
};

export default function PaginationView({
  currentPage,
  totalPages,
  paginationItemsToDisplay = 5,
  handlePageChange,
}: PaginationProps) {
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    totalPages,
    paginationItemsToDisplay,
  });

  return (
    <Pagination>
      <PaginationContent>
        {/* Previous page button */}
        <PaginationItem>
          <PaginationPrevious
            size={"sm"}
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            onClick={() =>
              handlePageChange(
                currentPage === 1 ? currentPage : currentPage - 1
              )
            }
            aria-disabled={currentPage === 1 ? true : undefined}
          />
        </PaginationItem>

        {/* Left ellipsis (...) */}
        {showLeftEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {/* Page number links */}
        {pages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              isActive={page === currentPage}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {/* Right ellipsis (...) */}
        {showRightEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {/* Next page button */}
        <PaginationItem>
          <PaginationNext
            size={"sm"}
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            onClick={() =>
              handlePageChange(
                currentPage === totalPages ? currentPage : currentPage + 1
              )
            }
            aria-disabled={currentPage === totalPages ? true : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
