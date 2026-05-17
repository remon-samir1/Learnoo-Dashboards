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

  university_id: z.string().trim().optional(),
  center_id: z.string().trim().optional(),
  faculty_id: z.string().trim().optional(),
  department_id: z.string().trim().optional(),

  image: z
    .custom<File>((value) => value === undefined || value instanceof File, {
      message: "Invalid image file",
    })
    .optional()
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
