"use client";



import { useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { useLocale, useTranslations } from "next-intl";

import { authApi } from "@/src/lib/api";

import UniversityFacultyFields from "@/components/student/profile/UniversityFacultyFields";

import { buildStudentAcademicUpdatePayload } from "@/src/lib/student-academic-update";

import { useAuthActions } from "@/src/stores/authStore";



type CompleteProfileFormProps = {

  defaultUniversityId: string;

  defaultCenterId: string;

  defaultFacultyId: string;

  defaultDepartmentId?: string;

  firstName: string;

  lastName: string;

};



export default function CompleteProfileForm({

  defaultUniversityId,

  defaultCenterId,

  defaultFacultyId,

  defaultDepartmentId = "",

  firstName,

  lastName,

}: CompleteProfileFormProps) {

  const router = useRouter();

  const locale = useLocale();

  const t = useTranslations("studentProfile.completeProfile");

  const { fetchCurrentUser } = useAuthActions();



  const [universityId, setUniversityId] = useState(defaultUniversityId);

  const [centerId, setCenterId] = useState(defaultCenterId);

  const [facultyId, setFacultyId] = useState(defaultFacultyId);

  const [departmentId, setDepartmentId] = useState(defaultDepartmentId);

  const [universityError, setUniversityError] = useState("");

  const [centerError, setCenterError] = useState("");

  const [facultyError, setFacultyError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);



  const validate = (): boolean => {

    let valid = true;



    if (!universityId) {

      setUniversityError(t("validation.universityRequired"));

      valid = false;

    } else {

      setUniversityError("");

    }



    if (!centerId) {

      setCenterError(t("validation.facultyRequired"));

      valid = false;

    } else {

      setCenterError("");

    }



    if (!facultyId) {

      setFacultyError(t("validation.centerRequired"));

      valid = false;

    } else {

      setFacultyError("");

    }



    return valid;

  };



  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {

    event.preventDefault();



    if (!validate()) return;



    setIsSubmitting(true);



    try {

      await authApi.update(

        buildStudentAcademicUpdatePayload(

          {

            universityId,

            centerId,

            facultyId,

            departmentId: departmentId || undefined,

          },

          { first_name: firstName, last_name: lastName },

        ),

      );



      await fetchCurrentUser();



      toast.success(t("toasts.success"));

      router.replace(`/${locale}/student`);

      router.refresh();

    } catch (error: unknown) {

      const message =

        error instanceof Error ? error.message : t("toasts.error");

      toast.error(message);

    } finally {

      setIsSubmitting(false);

    }

  };



  return (

    <form

      onSubmit={onSubmit}

      className="mx-auto w-full max-w-lg rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm"

    >

      <h1 className="text-2xl font-bold text-[var(--text-dark)]">{t("title")}</h1>

      <p className="mt-2 text-sm text-[var(--text-muted)]">{t("description")}</p>



      <div className="mt-6 grid gap-5 sm:grid-cols-2">

        <UniversityFacultyFields

          universityId={universityId}

          centerId={centerId}

          facultyId={facultyId}

          departmentId={departmentId}

          onUniversityChange={setUniversityId}

          onCenterChange={setCenterId}

          onFacultyChange={setFacultyId}

          onDepartmentChange={setDepartmentId}

          universityError={universityError}

          centerError={centerError}

          facultyError={facultyError}

          disabled={isSubmitting}

        />

      </div>



      <button

        type="submit"

        disabled={isSubmitting}

        className="mt-6 h-11 w-full rounded-xl bg-[var(--primary)] text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"

      >

        {isSubmitting ? t("buttons.saving") : t("buttons.save")}

      </button>

    </form>

  );

}


