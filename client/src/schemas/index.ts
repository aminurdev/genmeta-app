import * as z from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email("This is not a valid email."),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
  code: z.optional(z.string()),
});

export const signUpSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email("This is not a valid email."),
  password: z.string().min(6, {
    message: "Minimum 6 characters required.",
  }),
});
