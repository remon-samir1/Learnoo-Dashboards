"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import {
  updateProfileSchema,
  type UpdateProfileFormValues,
} from "@/src/schemas/profile.schema";
import { updateUserProfile } from "@/src/services/student/user.service";

type EditProfileFormProps = {
  defaultValues: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

export default function EditProfileForm({
  defaultValues,
}: EditProfileFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("studentProfile.editProfileStudent");

  const [preview, setPreview] = useState(defaultValues.image || "");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      first_name: defaultValues.first_name || "",
      last_name: defaultValues.last_name || "",
      phone: defaultValues.phone || "",
      email: defaultValues.email || "",
      image: undefined,
    },
  });

  const initials = useMemo(() => {
    const first = defaultValues.first_name?.[0] || "";
    const last = defaultValues.last_name?.[0] || "";
    return `${first}${last}`.toUpperCase() || "ST";
  }, [defaultValues.first_name, defaultValues.last_name]);

  const onSubmit = async (values: UpdateProfileFormValues) => {
    
    const res = await updateUserProfile(values);
   
    if (res?.success) {
      toast.success("Profile updated successfully");
      router.push(`/${locale}/student/profile`);
    }
    if (!res.success) {
      toast.error(res.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm"
    >
      <h1 className="mb-6 text-2xl font-bold text-[var(--text-dark)]">
        {t("title")}
      </h1>

      <div className="mb-6 flex items-center gap-5 border-b border-[var(--border-color)] pb-6">
        <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-[var(--primary)] text-2xl font-bold text-white">
          {preview ? (
            <Image
              src={preview}
              alt={t("imageAlt")}
              width={80}
              height={80}
              className="size-full object-cover"
              unoptimized
            />
          ) : (
            initials
          )}
        </div>

        <div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">
            <Upload size={16} />
            {t("uploadPhoto")}

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                setValue("image", file, { shouldValidate: true });
                setPreview(URL.createObjectURL(file));
              }}
            />
          </label>

          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {t("imageHint")}
          </p>

          {errors.image?.message && (
            <p className="mt-1 text-xs text-red-500">
              {String(errors.image.message)}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
            {t("fields.firstName")}
          </label>

          <input
            {...register("first_name")}
            className="h-11 w-full rounded-xl border border-[var(--border-color)] px-4 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
            {t("fields.lastName")}
          </label>

          <input
            {...register("last_name")}
            className="h-11 w-full rounded-xl border border-[var(--border-color)] px-4 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
            {t("fields.email")}
          </label>

          <input
            {...register("email")}
            className="h-11 w-full rounded-xl border border-[var(--border-color)] px-4 text-sm outline-none focus:border-[var(--primary)]"
          />

          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
            {t("fields.phone")}
          </label>

          <input
            {...register("phone")}
            className="h-11 w-full rounded-xl border border-[var(--border-color)] px-4 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 border-t border-[var(--border-color)] pt-5 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => router.push(`/${locale}/student/profile`)}
          className="h-11 rounded-xl border border-[var(--border-color)] text-sm font-semibold text-[var(--text-muted)] hover:bg-gray-50"
        >
          {t("buttons.cancel")}
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 rounded-xl bg-[var(--primary)] text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? t("buttons.saving") : t("buttons.saveChanges")}
        </button>
      </div>
    </form>
  );
}
