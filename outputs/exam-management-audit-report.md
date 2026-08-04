# Learnoo Exam Management Audit and Implementation Report

Date: 2026-08-04

## Executive Summary

The frontend-safe scope of the Admin, Doctor, and Student exam audit has been implemented using a contract-first approach. Existing architecture was preserved while exam list querying, cache behavior, form-state isolation, multipart media handling, AI extraction validation, results security, scoring normalization, translations, RTL behavior, and shared UI behavior were strengthened.

Requirements that cannot be implemented securely without authoritative backend contracts were intentionally stopped at the API boundary. No authorization, access mode, student relevance, result dataset, or AI output was fabricated or inferred as secure behavior.

## 1. Completed Frontend Changes

### Exam API state and TanStack Query

- Added typed quiz-list parameters for `page` and `title`.
- Added stable, feature-scoped query-key factories for lists, details, questions, attempts, and individual resources.
- Added `keepPreviousData` behavior for paginated transitions.
- Preserved pagination metadata rather than collapsing list responses into arrays.
- Added list and detail invalidation after create, update, delete, question changes, and direct multipart mutations.
- Retained a backward-compatible `useQuizzes` adapter while exposing the metadata-aware list hook.
- Typed the quiz-start mutation request and removed focused `any` usage.

### Admin and Doctor exam lists

- Consolidated duplicate list pages into `ExamManagementList`.
- Added 400 ms debounced API title search.
- Added API-driven page navigation and pagination metadata rendering.
- Added loading skeleton, empty state, search-empty state, error/retry state, and delete mutation state.
- Added translated success and failure feedback.
- Improved responsive horizontal scrolling and long-title/course-name truncation.
- Added accessible action labels and locale-aware pagination icons.
- Corrected Doctor edit/results route navigation.

### Create and edit form state

- Create Exam now starts blank every time.
- Removed create-draft persistence and restoration.
- Clears both `exam_create_form_draft` and `doctor_exam_create_form_draft` stale keys.
- Edit forms hydrate only from the selected server quiz.
- Removed stale edit-draft restoration and persistence.
- AI file/count and replacement-modal state reset when flows close or reopen.
- Direct multipart mutations now invalidate the list and selected detail appropriately.
- Doctor course-exam creation redirects into the real Doctor create form with `course_id` preselection.

### Questions, media, and feedback

- Added shared form types and multipart serialization.
- Preserved existing backend question/answer IDs during edits.
- Serialized new question images, answer images, textual reasons, and `reason_image` files.
- Preserved existing remote media when no replacement file is selected.
- Added object URL cleanup on replacement, removal, AI replacement, answer/question removal, and unmount.
- Replaced focused preview `<img>` usage with `next/image`.
- Added student-side `reason_image` rendering in answer review using the existing media URL resolver.
- Removed sensitive multipart payload/file logging and unnecessary file reconstruction.

### AI extraction

- Added runtime validation for the untrusted AI response envelope, question types, scores, question text, answers, correctness values, and answer-count constraints.
- Added generated IDs that cannot be confused with backend entity IDs.
- Made the extraction endpoint configurable through `AI_EXAM_EXTRACT_URL`.
- Requires HTTPS for the configured external endpoint.
- Validates authenticated requests, PDF MIME type, 15 MB size limit, and positive question count.
- Added a 60-second request timeout.
- Rejects invalid external responses instead of inserting fabricated questions.
- Improved translated loading and error states.

### Results and scoring

- Removed globally scoped attempt downloads from Admin and Doctor results pages.
- Removed browser-side role filtering as an authorization substitute.
- Replaced duplicate result pages with a shared secure state that explains the missing authorized backend contract.
- Added centralized student score normalization.
- Clamps displayed percentages and progress values to `0–100`.
- Handles invalid and zero totals without division by zero.
- Uses score/total fallback when a percentage is absent.
- Converts raw `passing_marks` against `total_marks` before percentage comparison.

### Student exam experience

- Confirmed Course Details renders only `course.attributes.exams`, avoiding unrelated global exam lists in that screen.
- Corrected student attempt/result percentage display and passing-state calculation.
- Added reason-image feedback rendering.
- Kept legacy access inference isolated and documented as non-authoritative pending explicit backend `access_mode`.
- Did not add a Student Home relevance widget using an unscoped collection because that could expose unrelated exams.

### Translations and RTL/LTR

- Recursively reconciled English and Arabic translation trees.
- Translation leaf paths and value types now match exactly.
- Added translations for AI, upload, validation, media, feedback, results, image actions, previews, insertion controls, and error UI.
- Removed direct user-visible English/Arabic strings from the four touched exam forms.
- Replaced physical spacing/positioning with logical classes in touched form controls.
- Added locale-aware back icons to Admin and Doctor create/edit forms.
- Corrected Doctor form back routes to `/doctor/exams`.

### Additional production hardening

- Added `metadataBase` with `NEXT_PUBLIC_APP_URL` support and a `https://learnoo.app` fallback, eliminating the localhost social-image URL fallback in the completed production build.
- Reviewed the generated Next.js route reference in `next-env.d.ts`; the production type generator correctly points to `./.next/types/routes.d.ts`.

## 2. Remaining Issues

### Frontend repository-wide lint debt

The modified exam feature files pass ESLint with zero output. However, the repository-wide `npm run lint` command currently reports:

- 812 findings total.
- 374 errors.
- 438 warnings.

These findings are predominantly pre-existing and distributed across unrelated activation pages, admin shared components, hooks, API/type files, media/DRM code, parent flows, and other modules. Representative categories include:

- `@typescript-eslint/no-explicit-any`.
- React 19 `set-state-in-effect` findings.
- Ref access during render.
- Unused imports and variables.
- Missing hook dependencies.

Resolving all 812 findings is a separate repository-wide refactor with regression risk outside the exam scope. It is tracked separately rather than being falsely reported as completed.

### Runtime integration checks requiring backend environments

- Confirm live backend handling of `GET /v1/quiz?page=...&title=...`.
- Confirm role-specific Admin/Doctor access on deployed environments.
- Confirm external AI extraction configuration and response compatibility.
- Confirm multipart preservation behavior against the production backend and storage service.

## 3. Backend Changes Required

### 3.1 Quiz list pagination and search contract

- **Endpoint:** `/v1/quiz`
- **Method:** `GET`
- **Query:**
  - `page: integer >= 1`
  - `title: string`, trimmed; empty values treated as absent
- **Response:** JSON:API-style list:
  - `data: Quiz[]`
  - `meta.current_page: number`
  - `meta.last_page: number`
  - `meta.per_page: number`
  - `meta.total: number`
  - optional pagination links
- **DTO/interface changes:** Document the list query DTO and pagination metadata. The frontend already uses `QuizListParams` and `ApiListResponse<Quiz>`.
- **Validation:** Reject invalid page values; bound title length; escape/parameterize title search.
- **Authorization:** Apply role scope before pagination and search. Doctors must only receive records they are authorized to manage.
- **Database:** Add or verify an index appropriate for case-insensitive title search and role/course ownership filters.
- **Reason:** `api-collection.yaml` currently declares `parameters: []`, so frontend support cannot be treated as a verified backend contract.

### 3.2 Authorized exam-scoped Admin/Doctor results

- **Endpoint:** Recommended `/v1/quiz/{quizId}/results`
- **Method:** `GET`
- **Query:**
  - `page: integer >= 1`
  - optional `student`, `status`, date filters, and export mode if required
- **Response:**
  - Quiz summary with `id`, `title`, `total_marks`, `passing_marks`, and attempt policy.
  - Paginated result rows with attempt ID, student identity permitted for the caller, raw score, total score, normalized percentage, pass state, timestamps, and attempt number.
  - Server-calculated aggregate metrics such as participant count, attempt count, average percentage, pass count, and fail count.
- **DTO/interface changes:** Add `QuizResultSummary`, `QuizResultRow`, and paginated result response DTOs.
- **Validation:** Validate quiz ID and filters; normalize percentage to `0–100`; safely handle zero totals.
- **Authorization:** Admin policy for permitted institutional scope. Doctor policy must verify quiz ownership/assignment. Never return a global attempt collection for client filtering.
- **Database:** Ensure attempt queries are indexed by `quiz_id`, user/student ID, and timestamps.
- **Reason:** Existing `/v1/quiz-attempt` is documented as “List of all quiz attempts” with no query or role-scoping contract. It is not safe for Admin/Doctor result pages.

### 3.3 Explicit exam access mode

- **Endpoint:** All student-facing quiz list/detail responses, including `/v1/quiz` and `/v1/quiz/{id}`.
- **Method:** `GET`
- **Response field:**
  - `access_mode: 'free' | 'standalone_paid' | 'course_included'`
  - recommended `can_access: boolean`
  - recommended `access_denial_reason: string | null`
  - optional activation/entitlement summary that does not leak unrelated data
- **DTO/interface changes:** Add `ExamAccessMode` and authoritative access-decision fields only after backend delivery.
- **Validation:** Restrict stored/serialized values to the enum.
- **Authorization:** Enforce access on start, view questions, submit, review, and result endpoints—not only in UI.
- **Database fields:** An explicit access mode on quizzes or an equivalent normalized entitlement model. Standalone quiz activation must be distinct from course activation.
- **Reason:** `is_public`, course IDs, `has_activation`, and attempt counters are ambiguous and cannot securely identify the three required product modes.

### 3.4 Student relevance-scoped latest exams

- **Endpoint:** Recommended `/v1/student/exams/latest` or a documented scoped mode on `/v1/quiz`.
- **Method:** `GET`
- **Query:** optional bounded `limit`, default suitable for the Home widget.
- **Response:** Latest active/published exams the authenticated student is eligible to discover, including minimal display fields and authoritative access decision.
- **DTO/interface changes:** Add a compact `StudentRelevantExam` DTO or reuse a documented student quiz resource.
- **Validation:** Bound limit; exclude expired/draft records unless explicitly required.
- **Authorization:** Scope server-side by authenticated student, University, Faculty, Center, and enrolled courses. Client filtering must not be the security boundary.
- **Database:** Index exam status/time/course relations and student enrollment/institution relations used in the relevance query.
- **Reason:** Loading a broad exam list and filtering in the browser may expose unrelated exams before filtering and cannot satisfy authorization.

### 3.5 Course Details exam scoping guarantee

- **Endpoint:** Course detail endpoint that supplies `course.attributes.exams`.
- **Method:** `GET`
- **Response:** Only exams belonging to the requested course and visible to the authenticated student.
- **Authorization:** Verify course access and exam visibility server-side.
- **Reason:** The frontend now consumes only the course-owned exams, but backend scoping remains authoritative.

### 3.6 Multipart media preservation and explicit removal

- **Endpoints:** `/v1/quiz` and `/v1/quiz/{id}`.
- **Methods:** `POST`, `PUT`/`PATCH` as supported.
- **Request:** Continue supporting nested multipart fields such as:
  - `questions[index][image]`
  - `questions[index][answers][index][image]`
  - `questions[index][answers][index][reason_image]`
- **Preservation rule:** Omitted media fields on existing entities preserve current media.
- **Removal contract:** Add documented explicit flags, for example `remove_image=1` and `remove_reason_image=1`, or accept explicit `null` with documented semantics.
- **Response:** Return canonical media URLs after mutation.
- **DTO/interface changes:** Document nested multipart identifiers, preservation, replacement, and removal semantics.
- **Validation:** MIME allowlist, image size/dimensions, entity ownership, and nested index/ID consistency.
- **Authorization:** Validate that the caller may modify the quiz and nested resources.
- **Database/storage:** Remove replaced/deleted storage objects transactionally or through reliable cleanup jobs.
- **Reason:** Replacement and preservation are safe in the frontend, but explicit deletion of existing remote files cannot be inferred.

### 3.7 Passing marks and score semantics

- **Endpoints:** Quiz detail, attempt finish/result, and Admin/Doctor result endpoints.
- **Response:** Explicitly document whether `passing_marks` is a raw score or a percentage. Recommended fields:
  - `passing_score` for raw score.
  - `passing_percentage` for normalized percentage.
  - server-authoritative `passed` on each result.
- **Validation:** `total_marks > 0`; raw passing score within allowed total; percentage within `0–100`.
- **Authorization:** Result data scoped to authorized callers.
- **Database:** Preserve raw scores and totals; avoid storing ambiguous mixed units.
- **Reason:** The frontend can display defensively, but pass/fail must be server-authoritative and semantically unambiguous.

### 3.8 AI extraction service contract

- **Frontend proxy endpoint:** `/api/ai-exam-extract`
- **Method:** `POST multipart/form-data`
- **Request:** authenticated PDF file and optional positive integer `questions`.
- **External service:** HTTPS URL configured by `AI_EXAM_EXTRACT_URL`.
- **Response shape:** Array or documented envelope accepted by the runtime parser, with question text, supported type, finite non-negative score, and valid answers.
- **Validation:** PDF MIME, maximum 15 MB, timeout, safe response-size limits, schema validation, and sanitized error mapping.
- **Authorization:** Keep the proxy authenticated and add rate limiting/quota controls.
- **Database:** None required unless extraction jobs/history are persisted.
- **Reason:** Production AI behavior must depend on a real configured service and validated output; the frontend must never fabricate extraction results.

### 3.9 Draft visibility and role scope

- **Endpoints:** All quiz list/detail/start endpoints.
- **Authorization:** Draft exams should only be visible to authorized Admin/Doctor users. Students must receive only active/published exams within their institution/course scope.
- **Reason:** UI filtering cannot prevent direct API access or data disclosure.

## 4. Risks and Recommendations

1. **Do not release Admin/Doctor results as real data** until the exam-scoped endpoint and role policies are implemented. The current secure unavailable state is intentional.
2. **Do not implement the Student Home widget from an unscoped list.** Wait for the relevance-scoped endpoint.
3. **Do not infer `access_mode`.** Migrate legacy activation helpers only after the backend supplies explicit, authoritative values.
4. **Confirm quiz pagination/search in staging.** The frontend is ready, but the OpenAPI document does not declare the contract.
5. **Define explicit media deletion semantics** before adding “remove existing server image” behavior.
6. **Set `NEXT_PUBLIC_APP_URL` in each deployment environment** so metadata resolves to the correct canonical host.
7. **Plan a separate lint-debt initiative.** Fixing hundreds of unrelated React 19 and TypeScript lint findings should be organized by module with regression tests.
8. **Add automated tests** for query-key invalidation, multipart field construction, AI runtime parsing, score normalization, and locale parity.
9. **Add API integration tests** for Doctor ownership, institutional student relevance, draft exclusion, and all three access modes.

## 5. Additional Defects Discovered and Resolution

- Doctor result/edit links previously targeted malformed or Admin paths; corrected.
- Doctor course exam creation was disconnected static UI; replaced with a redirect to the real create flow and course preselection.
- AI-generated IDs could resemble persisted entity IDs; changed to unmistakably new IDs and handled legacy AI prefixes defensively.
- Blob preview URLs leaked; complete lifecycle cleanup added.
- Multipart serialization was duplicated across four pages; centralized.
- Direct multipart mutations did not consistently invalidate query caches; fixed.
- API error parsing relied on `any`; replaced in touched form flows with defensive `unknown` parsing.
- AI modal and replacement state could leak between operations; reset paths added.
- Student percentage displays could exceed 100 or divide by zero; centralized defensive normalization added.
- Student feedback ignored `reason_image`; rendering added.
- English/Arabic translation trees diverged; recursively reconciled.
- Physical left/right form styles and back arrows were not locale-aware; logical spacing and locale-aware icons added.
- Build metadata used localhost as the fallback for Open Graph/Twitter images; `metadataBase` added.

## 6. Validation Record

### Passed

- Translation JSON parse: passed for `messages/en.json` and `messages/ar.json`.
- Recursive EN/AR parity: no missing paths and no value-type differences.
- TypeScript: `npm run typecheck` passed with zero errors.
- Modified exam-feature ESLint: passed with zero output.
- Production build: compiled successfully, TypeScript completed, and 122 static pages generated.
- Route generation includes all Admin, Doctor, Student, and API exam routes.
- Git whitespace validation: `git diff --check` passed.

### Repository-wide quality gate not yet clean

- Full `npm run lint`: fails on 812 legacy findings across the wider repository (374 errors, 438 warnings).
- The modified exam feature is clean; the repository-wide lint debt is separately tracked and must be resolved before claiming a global zero-error ESLint baseline.

## Conclusion

All safe frontend implementation work in the approved exam-management scope is complete and production-buildable. Security-sensitive functionality that requires backend authority has been deliberately left behind explicit unavailable states or existing isolated legacy behavior, with full backend contracts documented above. The remaining global blocker is repository-wide pre-existing ESLint debt outside the exam-focused change set.