// Add or update the MetadataResult interface
export interface MetadataResult {
  id: string;
  fileName: string;
  title: string;
  description: string;
  keywords: string[];
  status: "processing" | "completed" | "failed";
  error?: string;
  imageUrl?: string;
}

export interface EditingState {
  id: string | null;
  field: "title" | "description" | "keywords" | null;
}

export interface SocketEvents {
  processStart: (data: { total: number }) => void;
  processProgress: (data: ProcessProgressData) => void;
  processError: (data: { error: string }) => void;
  processComplete: (data: ProcessCompleteData) => void;
}

export interface ServerMetadataResponse {
  _id?: string;
  id?: string;
  filename: string;
  imageUrl: string;
  status: string;
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface ProcessProgressData {
  completed: number;
  total: number;
  currentResult: ServerMetadataResponse;
}

export interface ProcessCompleteData {
  status: string;
  results: {
    id: string;
    downloadable: boolean;
    data: Array<ServerMetadataResponse>;
  };
}
