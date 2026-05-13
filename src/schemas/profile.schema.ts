import { z } from "zod";

const optionalText = z.string().trim().optional();

export const updateProfileSchema = z.object({
  first_name: optionalText,
  last_name: optionalText,
  phone: optionalText,
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: "Invalid email address",
    }),

  image: z
    .any()
    .optional()
    .refine((file) => !file || file instanceof File, "Invalid image file")
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024,
      "Image must be less than 5MB",
    )
    .refine(
      (file) =>
        !file || ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "Only JPG, PNG, WEBP are allowed",
    ),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
