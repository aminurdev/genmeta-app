export interface MetadataResult {
  id: string;
  fileName: string;
  title: string;
  description: string;
  keywords: string[];
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  imageUrl?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    userId: string;
    batchId: string;
    successfulImages: {
      imageName: string;
      imageUrl: string;
      size: number;
      metadata: {
        title: string;
        description: string;
        keywords: string[];
      };
    }[];
    failedImages: {
      filename: string;
      error: string;
    }[];
    remainingTokens: number;
  };
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
