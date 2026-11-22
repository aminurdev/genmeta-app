import type { UserT } from "./user";

export type AuthUser = UserT;

export interface RegisterResponse {
  email: string;
  requiresVerification: boolean;
}

export interface ResendVerificationResponse {
  email: string;
}

export interface LoginResponse {
  user: AuthUser;
  sessionId?: string;
}

export interface VerifyGoogleResponse {
  user: AuthUser;
  sessionId?: string;
  redirectPath?: string;
}

export interface RequestResetResponse {
  email: string;
}

export interface VerifyOtpResponse {
  resetToken: string;
}

export interface CurrentUserResponse {
  user: AuthUser;
  currentSessionId: string | null;
}

export interface SessionInfo {
  id: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  lastActiveAt: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface ActiveSessionsResponse {
  sessions: SessionInfo[];
}
