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
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters." }),
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required." })
    .email("This is not a valid email."),
  password: z
    .string()
    .min(8, { message: "Minimum 8 characters required." })
    .max(72, { message: "Maximum 72 characters allowed." }),
});
