"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAccessToken, getBaseApi } from "@/services/image-services";
import type { Batch } from "@/app/(main)/results/page";
import { formatFileSize, formatTimeAgo } from "@/lib/utils";
import { handleDownloadZip } from "@/actions";
import { Loader2 } from "lucide-react";

export default function HistoryTab() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  interface Data {
    totalPages: number;
    currentPage: number;
    totalBatches: number;
    images: Batch[];
  }

  interface BatchResponse {
    success: boolean;
    data: Data;
  }

  useEffect(() => {
    const fetchBatches = async (pageNumber: number): Promise<void> => {
      setIsLoading(true);
      try {
        const baseAPi = await getBaseApi();
        const accessToken = await getAccessToken();

        const response = await fetch(
          `${baseAPi}/images/batches?page=${pageNumber}&limit=6`,
          {
            headers: {
              authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
          }
        );
        const data: BatchResponse = await response.json();

        if (data.success) {
          setBatches(data.data.images);
          setTotalPages(data.data.totalPages);
          setPage(data.data.currentPage);
        }
      } catch (error) {
        console.error("Failed to fetch batches:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatches(page);
  }, [page]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Name</TableHead>
              <TableHead className=" ">Date</TableHead>
              <TableHead className=" ">Process Type</TableHead>
              <TableHead className=" ">Images Count</TableHead>
              <TableHead className=" ">Token Used</TableHead>
              <TableHead className=" ">Total Size</TableHead>
              <TableHead className=" ">Status</TableHead>
              <TableHead className=" "></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className=" ">
            {isLoading && batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24  ">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading batches...
                  </div>
                </TableCell>
              </TableRow>
            ) : batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24  ">
                  No batches found
                </TableCell>
              </TableRow>
            ) : (
              batches.map((batch) => (
                <TableRow key={batch._id}>
                  <TableCell className=" ">{batch.name}</TableCell>
                  <TableCell>{formatTimeAgo(batch.createdAt)}</TableCell>
                  <TableCell>Metadata Generate</TableCell>
                  <TableCell>{batch.imagesCount}</TableCell>
                  <TableCell>{batch.imagesCount}</TableCell>
                  <TableCell>{formatFileSize(batch.totalSize)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        batch.status === "completed"
                          ? "default"
                          : batch.status === "processing"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {batch.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleDownloadZip(batch.batchId)}
                      variant="outline"
                      size="sm"
                    >
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Fixed pagination at the bottom */}
      <div className="flex items-center justify-between py-4 mt-auto">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isLoading}
          onClick={() => setPage((prev) => prev - 1)}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isLoading}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
