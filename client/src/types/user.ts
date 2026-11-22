export type UserRole = "user" | "admin" | "superAdmin";

export interface UserT {
  _id?: string;
  id?: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  isVerified?: boolean;
  isDisabled?: boolean;
  loginProvider?: ("email" | "google")[];
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type User = UserT | null;
