export interface MetadataResult {
  id: string;
  fileName: string;
  title: string;
  description: string;
  keywords: string[];
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
}

export interface MetadataLimits {
  titleLength: number;
  descriptionLength: number;
  keywordsCount: number;
  helpText?: string;
}

export interface EditingState {
  id: string | null;
  field:
    | keyof Pick<MetadataResult, "title" | "description" | "keywords">
    | null;
}

export interface FileCounters {
  selected: number;
  processed: number;
  remaining: number;
  failed: number;
  inProgress: number;
}
