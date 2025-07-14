export interface UserT {
  userId: string;
  name: string;
  email: string;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
}

export type User = UserT | null;
