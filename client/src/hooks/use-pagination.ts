type UsePaginationProps = {
  currentPage: number;
  totalPages: number;
  paginationItemsToDisplay?: number;
};

export type PaginationItemEntry = number | "ellipsis-left" | "ellipsis-right";

type UsePaginationReturn = {
  items: PaginationItemEntry[];
  pages: number[];
  showLeftEllipsis: boolean;
  showRightEllipsis: boolean;
  currentPage: number;
  totalPages: number;
};

export function usePagination({
  currentPage,
  totalPages,
  paginationItemsToDisplay = 5,
}: UsePaginationProps): UsePaginationReturn {
  const safeTotalPages = Math.max(1, Math.floor(totalPages) || 1);
  const safeCurrentPage = Math.min(
    Math.max(1, Math.floor(currentPage) || 1),
    safeTotalPages
  );

  const maxDirectPages = Math.max(5, paginationItemsToDisplay + 2);

  let items: PaginationItemEntry[];

  if (safeTotalPages <= maxDirectPages) {
    items = Array.from({ length: safeTotalPages }, (_, i) => i + 1);
  } else if (safeCurrentPage <= 3) {
    items = [1, 2, 3, 4, "ellipsis-right", safeTotalPages];
  } else if (safeCurrentPage >= safeTotalPages - 2) {
    items = [
      1,
      "ellipsis-left",
      safeTotalPages - 3,
      safeTotalPages - 2,
      safeTotalPages - 1,
      safeTotalPages,
    ];
  } else {
    items = [
      1,
      "ellipsis-left",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "ellipsis-right",
      safeTotalPages,
    ];
  }

  const pages = items.filter((item): item is number => typeof item === "number");
  const showLeftEllipsis = items.includes("ellipsis-left");
  const showRightEllipsis = items.includes("ellipsis-right");

  return {
    items,
    pages,
    showLeftEllipsis,
    showRightEllipsis,
    currentPage: safeCurrentPage,
    totalPages: safeTotalPages,
  };
}
