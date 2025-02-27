export interface User {
  userId: string;
  name: string;
  email: string;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
}
