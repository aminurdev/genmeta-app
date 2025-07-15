export interface UserT {
  userId: string;
  name: string;
  email: string;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
  avatar?: string;
}

export type User = UserT | null;
