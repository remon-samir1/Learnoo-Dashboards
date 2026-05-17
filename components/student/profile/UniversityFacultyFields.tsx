"use client";



import { useEffect, useMemo, useRef, useState } from "react";

import { useTranslations } from "next-intl";

import { facultiesApi, universitiesApi } from "@/src/lib/api";

import {
  buildCenterFacultyOptions,
  buildUniversityCenterOptions,
  centerBelongsToUniversity,
  facultyBelongsToCenter,
  findCenterOptionById,
  findFacultyById,
} from "@/src/lib/faculty-university";
import {
  buildFacultyDepartmentOptions,
  departmentBelongsToFaculty,
  getFacultyChildrens,
} from "@/src/lib/student-faculty-departments";
import type { FacultyForSelection, University } from "@/src/types/student-academic.types";



type UniversityFacultyFieldsProps = {

  universityId: string;

  centerId: string;

  facultyId: string;

  departmentId?: string;

  onUniversityChange: (value: string) => void;

  onCenterChange: (value: string) => void;

  onFacultyChange: (value: string) => void;

  onDepartmentChange?: (value: string) => void;

  universityError?: string;

  centerError?: string;

  facultyError?: string;

  departmentError?: string;

  disabled?: boolean;

};



export default function UniversityFacultyFields({

  universityId,

  centerId,

  facultyId,

  departmentId = "",

  onUniversityChange,

  onCenterChange,

  onFacultyChange,

  onDepartmentChange,

  universityError,

  centerError,

  facultyError,

  departmentError,

  disabled = false,

}: UniversityFacultyFieldsProps) {

  const t = useTranslations("studentProfile.academic");



  const [universities, setUniversities] = useState<University[]>([]);

  const [faculties, setFaculties] = useState<FacultyForSelection[]>([]);

  const [loadingUniversities, setLoadingUniversities] = useState(true);

  const [loadingFaculties, setLoadingFaculties] = useState(true);

  const [fetchError, setFetchError] = useState("");
  const [facultyDetailById, setFacultyDetailById] = useState<
    Record<string, FacultyForSelection>
  >({});
  const [loadingFacultyDetailId, setLoadingFacultyDetailId] = useState<
    string | null
  >(null);
  const fetchedFacultyDetailIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function loadUniversities() {

      setLoadingUniversities(true);

      setFetchError("");



      try {

        const response = await universitiesApi.list();

        if (!cancelled) {

          setUniversities((response.data ?? []) as University[]);

        }

      } catch (error: unknown) {

        if (!cancelled) {

          setFetchError(

            error instanceof Error ? error.message : t("loadError"),

          );

        }

      } finally {

        if (!cancelled) {

          setLoadingUniversities(false);

        }

      }

    }



    void loadUniversities();



    return () => {

      cancelled = true;

    };

  }, [t]);



  useEffect(() => {

    let cancelled = false;



    async function loadFaculties() {

      setLoadingFaculties(true);



      try {

        const response = await facultiesApi.list();

        if (!cancelled) {

          setFaculties((response.data ?? []) as FacultyForSelection[]);

        }

      } catch (error: unknown) {

        if (!cancelled) {

          setFetchError(

            error instanceof Error ? error.message : t("loadError"),

          );

        }

      } finally {

        if (!cancelled) {

          setLoadingFaculties(false);

        }

      }

    }



    void loadFaculties();



    return () => {

      cancelled = true;

    };

  }, [t]);



  const centerOptions = useMemo(

    () => buildUniversityCenterOptions(faculties, universityId),

    [faculties, universityId],

  );



  const facultyOptions = useMemo(

    () => buildCenterFacultyOptions(faculties, centerId),

    [faculties, centerId],

  );



  const selectedFacultyDetail = facultyId
    ? facultyDetailById[facultyId]
    : undefined;

  const departmentOptions = useMemo(
    () =>
      buildFacultyDepartmentOptions(faculties, facultyId, selectedFacultyDetail),
    [faculties, facultyId, selectedFacultyDetail],
  );

  const showDepartmentField = Boolean(facultyId && onDepartmentChange);

  useEffect(() => {
    if (!facultyId) {
      return;
    }

    const fromList = findFacultyById(faculties, facultyId);
    if (getFacultyChildrens(fromList).length > 0) {
      return;
    }

    if (fetchedFacultyDetailIds.current.has(facultyId)) {
      return;
    }

    fetchedFacultyDetailIds.current.add(facultyId);

    let cancelled = false;

    async function loadFacultyDetail() {
      setLoadingFacultyDetailId(facultyId);

      try {
        const response = await facultiesApi.get(Number(facultyId));
        const detail = response.data as FacultyForSelection | undefined;

        if (!cancelled && detail) {
          setFacultyDetailById((previous) => ({
            ...previous,
            [facultyId]: detail,
          }));
        }
      } catch {
        // Optional field — show empty state if detail fetch fails.
      } finally {
        if (!cancelled) {
          setLoadingFacultyDetailId(null);
        }
      }
    }

    void loadFacultyDetail();

    return () => {
      cancelled = true;
    };
  }, [facultyId, faculties]);

  useEffect(() => {
    if (loadingFaculties || !facultyId || !centerId) {

      return;

    }



    const faculty = findFacultyById(faculties, facultyId);

    if (faculty && !facultyBelongsToCenter(faculty, centerId)) {

      onFacultyChange("");

      onDepartmentChange?.("");

    }

  }, [centerId, facultyId, faculties, loadingFaculties, onFacultyChange, onDepartmentChange]);



  useEffect(() => {

    if (loadingFaculties || !centerId || !universityId) {

      return;

    }



    const center = findCenterOptionById(centerOptions, centerId);

    if (center && !centerBelongsToUniversity(center, universityId, faculties)) {

      onCenterChange("");

      onFacultyChange("");

      onDepartmentChange?.("");

    }

  }, [

    centerOptions,

    centerId,

    universityId,

    faculties,

    loadingFaculties,

    onCenterChange,

    onFacultyChange,

    onDepartmentChange,

  ]);



  useEffect(() => {

    if (loadingFaculties || !departmentId || !facultyId) {

      return;

    }



    if (
      !departmentBelongsToFaculty(
        faculties,
        departmentId,
        facultyId,
        selectedFacultyDetail,
      )
    ) {
      onDepartmentChange?.("");
    }
  }, [
    departmentId,
    facultyId,
    faculties,
    loadingFaculties,
    onDepartmentChange,
    selectedFacultyDetail,
  ]);



  const handleUniversityChange = (newUniversityId: string) => {

    onUniversityChange(newUniversityId);

    onCenterChange("");

    onFacultyChange("");

    onDepartmentChange?.("");

  };



  const handleCenterChange = (newCenterId: string) => {

    onCenterChange(newCenterId);



    if (facultyId) {

      const faculty = findFacultyById(faculties, facultyId);

      if (!facultyBelongsToCenter(faculty, newCenterId)) {

        onFacultyChange("");

        onDepartmentChange?.("");

      }

    }

  };



  const handleFacultyChange = (newFacultyId: string) => {

    onFacultyChange(newFacultyId);

    onDepartmentChange?.("");

  };



  const selectClassName =

    "h-11 w-full rounded-xl border border-[var(--border-color)] bg-white px-4 text-sm outline-none focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60";



  return (

    <>

      {fetchError ? (

        <div className="sm:col-span-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">

          {fetchError}

        </div>

      ) : null}



      <div className="sm:col-span-2">

        <label className="mb-2 block text-xs font-medium text-[var(--text-muted)]">

          {t("university")}

        </label>



        {loadingUniversities ? (

          <p className="text-sm text-[var(--text-muted)]">{t("loading")}</p>

        ) : universities.length === 0 ? (

          <p className="text-sm text-[var(--text-muted)]">

            {t("emptyUniversities")}

          </p>

        ) : (

          <select

            value={universityId}

            onChange={(event) => handleUniversityChange(event.target.value)}

            disabled={disabled}

            className={selectClassName}

          >

            <option value="">{t("selectUniversity")}</option>

            {universities.map((university) => (

              <option key={university.id} value={university.id}>

                {university.attributes.name}

              </option>

            ))}

          </select>

        )}



        {universityError ? (

          <p className="mt-1 text-xs text-red-500">{universityError}</p>

        ) : null}

      </div>



      <div className="sm:col-span-2">

        <label className="mb-2 block text-xs font-medium text-[var(--text-muted)]">

          {t("faculty")}

        </label>



        {loadingFaculties ? (

          <p className="text-sm text-[var(--text-muted)]">{t("loading")}</p>

        ) : !universityId ? (

          <p className="text-sm text-[var(--text-muted)]">

            {t("selectUniversityFirst")}

          </p>

        ) : centerOptions.length === 0 ? (

          <p className="text-sm text-[var(--text-muted)]">{t("emptyCenters")}</p>

        ) : (

          <select

            value={centerId}

            onChange={(event) => handleCenterChange(event.target.value)}

            disabled={disabled || !universityId}

            className={selectClassName}

          >

            <option value="">{t("selectFaculty")}</option>

            {centerOptions.map((center) => (

              <option key={center.id} value={center.id}>

                {center.label}

              </option>

            ))}

          </select>

        )}



        {centerError ? (

          <p className="mt-1 text-xs text-red-500">{centerError}</p>

        ) : null}

      </div>



      <div className="sm:col-span-2">

        <label className="mb-2 block text-xs font-medium text-[var(--text-muted)]">

          {t("center")}

        </label>



        {loadingFaculties ? (

          <p className="text-sm text-[var(--text-muted)]">{t("loading")}</p>

        ) : !centerId ? (

          <p className="text-sm text-[var(--text-muted)]">

            {t("selectFacultyFirst")}

          </p>

        ) : facultyOptions.length === 0 ? (

          <p className="text-sm text-[var(--text-muted)]">{t("emptyFaculties")}</p>

        ) : (

          <select

            value={facultyId}

            onChange={(event) => handleFacultyChange(event.target.value)}

            disabled={disabled || !centerId}

            className={selectClassName}

          >

            <option value="">{t("selectCenter")}</option>

            {facultyOptions.map((faculty) => (

              <option key={faculty.id} value={faculty.id}>

                {faculty.label}

              </option>

            ))}

          </select>

        )}



        {facultyError ? (

          <p className="mt-1 text-xs text-red-500">{facultyError}</p>

        ) : null}

      </div>



      {/* {showDepartmentField && onDepartmentChange ? (

        <div className="sm:col-span-2">

          <label className="mb-2 block text-xs font-medium text-[var(--text-muted)]">

            {t("department")}

          </label>



          {loadingFaculties || loadingFacultyDetailId === facultyId ? (
            <p className="text-sm text-[var(--text-muted)]">{t("loading")}</p>
          ) : !facultyId ? (
            <p className="text-sm text-[var(--text-muted)]">
              {t("selectFacultyFirst")}
            </p>
          ) : departmentOptions.length === 0 ? (

            <p className="text-sm text-[var(--text-muted)]">

              {t("emptyDepartments")}

            </p>

          ) : (

            <select

              value={departmentId}

              onChange={(event) => onDepartmentChange(event.target.value)}

              disabled={disabled || !facultyId}

              className={selectClassName}

            >

              <option value="">{t("selectDepartment")}</option>

              {departmentOptions.map((department) => (

                <option key={department.id} value={department.id}>

                  {department.label}

                </option>

              ))}

            </select>

          )}



          {departmentError ? (

            <p className="mt-1 text-xs text-red-500">{departmentError}</p>

          ) : null}

        </div>

      ) : null} */}

    </>

  );

}


