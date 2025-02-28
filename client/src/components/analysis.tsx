import React from "react";
import { Button } from "./ui/button";
import { CheckSquare, ImageIcon, Square, Trash2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Images } from "./context/image-context";

export interface AnalysisProps {
  totalImages: number;
  queueCount: number;
  failedCount: number;
  processingCount: number;
  successCount: number;
  selectAll: boolean;
  handleDeleteSelected: () => void;
  images: Images;
  handleSelectAll: () => void;
}

const Analysis = ({ props }: { props: AnalysisProps }) => {
  return (
    <div className="mb-4 flex flex-col sm:flex-row justify-between gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={props.handleSelectAll}
          className="flex items-center gap-1"
          disabled={props.images.images.length === 0}
        >
          {props.selectAll ? <CheckSquare size={16} /> : <Square size={16} />}
          {props.selectAll ? "Deselect All" : "Select All"}
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={props.handleDeleteSelected}
          disabled={!props.images.images.some((img) => img.selected)}
          className="flex items-center gap-1"
        >
          <Trash2 size={16} />
          Delete Selected
        </Button>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <Badge variant="outline" className="flex items-center gap-1">
          <ImageIcon size={14} />
          Total: {props.totalImages}
        </Badge>
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
        >
          Success: {props.successCount}
        </Badge>
        <Badge
          variant="outline"
          className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
        >
          Failed: {props.failedCount}
        </Badge>
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
        >
          In Queue: {props.processingCount}
        </Badge>
        <Badge
          variant="outline"
          className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
        >
          Default: {props.queueCount}
        </Badge>
      </div>
    </div>
  );
};

export default Analysis;
