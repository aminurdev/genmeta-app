import { AxiosError, AxiosResponse } from "axios";

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  stack?: string;
}

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  message?: string;
  data: T | null;
}
export type AxiosApiError = AxiosError<ApiErrorResponse>;
export type AxiosApiResponse<T> = AxiosResponse<ApiResponse<T>>;
