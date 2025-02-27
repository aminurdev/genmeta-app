import * as z from "zod";

export const createLinkSchema = z.object({
  link: z
    .string()
    .regex(
      /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/,
      "Invalid URL format. Please enter a valid link."
    ),
  title: z
    .string()
    .max(100, "Title must be less than 100 characters")
    .optional(),

  // tags: z
  //   .array(
  //     z.object({
  //       id: z.number(),
  //       text: z.string(),
  //     })
  //   )
  //   .max(10, "Maximum 10 tags allowed")
  //   .optional(),

  isQrCode: z.boolean().default(false),

  customAlias: z
    .string()
    .min(3, "Custom alias must be at least 3 characters")
    .max(8, "Custom alias must be at most 8 characters")
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      "Only letters, numbers, hyphens, and underscores are allowed"
    )
    .optional(),
});

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
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email("This is not a valid email."),
  password: z.string().min(6, {
    message: "Minimum 6 characters required.",
  }),
  name: z.string().min(1, {
    message: "Name is required.",
  }),
});
