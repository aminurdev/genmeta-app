export type UserRole = "user" | "admin" | "superAdmin";

export interface UserT {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
  avatar?: string;
  isVerified?: boolean;
}

export type User = UserT | null;
