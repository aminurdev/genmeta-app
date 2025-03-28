interface BatchData {
  batchId: string;
  status: "Processing";
  totalImages: number;
  userId: string;
  _id: string;
  successfulImages?: Metadata[];
  failedImages?: FailedImage[];
  remainingTokens?: number;
  successfulImagesCount?: number;
  failedImagesCount?: number;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: BatchData;
}

type Plan = {
  planId: string;
  status: "Active" | "Expired";
  expiresDate: string;
};

export type UserPlanData = {
  _id: string;
  userId: string;
  availableTokens: number;
  totalImageProcessed?: number;
  tokensUsedThisMonth?: number;
  totalTokensUsed?: number;
  totalTokensPurchased: number;
  plan?: Plan;
  createdAt: string;
  updatedAt: string;
};

// Define types for batch and image
export type Metadata = {
  imageName: string;
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
};

interface FailedImage {
  filename: string;
  error: string;
}

interface BatchResultData {
  _id: string;
  batchId: string;
  name: string;
  status: "Pending" | "Partial" | "Completed" | "Failed";
  tokensUsed: number;
  successfulImagesCount?: number;
  failedImagesCount?: number;
  failedImages?: FailedImage[];
}

export interface PollProcessResponse {
  success: boolean;
  message: string;
  data: BatchResultData;
}
