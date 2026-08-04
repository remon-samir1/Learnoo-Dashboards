# Backend Implementation Prompt — Learnoo Exam System Alignment

Copy this entire prompt into the backend repository's coding agent.

---

You are a Senior Backend Engineer working inside the Learnoo backend repository. Your task is to audit and implement the backend contracts required by the already-completed frontend exam-management refactor.

Do not assume the backend framework, architecture, authentication package, database engine, naming conventions, or storage provider before inspecting the repository. Preserve the current architecture and reuse existing controllers, services, repositories, policies, resources/serializers, request validators, jobs, events, and test conventions wherever possible.

The frontend repository is a Next.js application consuming JSON:API-style resources from an API whose default base URL is `https://api.learnoo.app`. The known exam routes use the `/v1` prefix.

## Non-Negotiable Rules

1. Audit before modifying code.
2. Do not fabricate data, authorization, access decisions, AI output, enrollment relationships, or result aggregates.
3. Authorization must be enforced by the backend at the API/resource level. Client filtering is never authorization.
4. Preserve backward compatibility unless a security defect requires a breaking change.
5. If a requested contract already exists under a different endpoint or name, reuse it and document the exact final contract instead of creating a duplicate.
6. Use database transactions for quiz, question, answer, media, and entitlement mutations where partial updates would corrupt data.
7. Add automated tests for every contract, validation rule, authorization boundary, and role scope implemented.
8. Update the authoritative OpenAPI/API collection documentation. The current frontend copy documents `GET /v1/quiz` and `GET /v1/quiz-attempt` with `parameters: []`, which is insufficient.
9. Never weaken security or validation to make frontend requests pass.
10. Do not implement implicit access-mode inference in the response. The API must return an explicit authoritative mode.
11. Keep response percentages within `0–100`, safely handle zero totals, and keep pass/fail server-authoritative.
12. Return canonical public media URLs, not internal filesystem paths.
13. Do not expose draft exams, unrelated exams, global attempt lists, or student personal data outside the caller's authorized scope.
14. Continue until implementation, migrations, documentation, and tests are complete. If a requirement is structurally blocked, document the exact blocker and the smallest safe backend change needed.

## Phase 1 — Repository and Domain Audit

Before writing code, identify and report:

- Backend framework and version.
- Authentication mechanism and current user/role model.
- Roles and permissions for Admin, Doctor/Instructor, Student, and any super-admin role.
- Models/entities and database tables for:
  - quizzes/exams;
  - quiz questions;
  - quiz answers;
  - quiz attempts;
  - attempt answers or selected answers;
  - courses;
  - chapters;
  - enrollments/subscriptions;
  - activation codes or entitlements;
  - University, Faculty, and Center relationships;
  - media/file records if present.
- Existing routes, controllers, services, resources/serializers, request DTOs/validators, policies, scopes, repository classes, events, and tests related to exams.
- Current semantics of:
  - `is_public`;
  - `has_activation`;
  - `status`;
  - `passing_marks`;
  - `total_marks`;
  - `max_attempts`;
  - course activation versus quiz activation.
- Whether Doctor ownership is direct, course-based, institution-based, assignment-based, or another model.
- Whether quiz list responses are already paginated in production even though the API documentation does not describe it.
- Current multipart update semantics for omitted, replaced, and removed media.
- Current AI extraction architecture, if any.

Do not begin migrations or implementation until these relationships and semantics are understood.

## Phase 2 — Canonical API Envelope

The frontend expects JSON:API-style resources:

```json
{
  "data": {
    "id": "123",
    "type": "quizzes",
    "attributes": {}
  }
}
```

List responses must follow:

```json
{
  "data": [],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 3,
    "path": "https://api.example.com/v1/quiz",
    "per_page": 15,
    "to": 15,
    "total": 34
  },
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  }
}
```

Resource IDs must be consistently serialized as strings at the JSON:API envelope level. Domain foreign keys may remain integers in attributes if that is the existing convention.

Use the project's established error envelope. Validation errors must be machine-readable and safe to display. Do not expose stack traces, SQL, filesystem paths, secrets, or external service internals.

## Phase 3 — Quiz List Pagination, Search, and Role Scope

### Endpoint

```text
GET /v1/quiz
```

### Supported query

```text
page: integer, minimum 1, default 1
title: optional string, trim whitespace, ignore when empty
per_page: optional only if the existing API supports it; enforce a safe maximum
```

### Required behavior

- Search by quiz title using a parameterized, case-insensitive query appropriate for the database.
- Apply authorization and role scope before search and pagination.
- Admin receives only quizzes within the Admin's permitted institutional scope unless the role is explicitly global.
- Doctor receives only quizzes the Doctor owns or is authorized to manage through the repository's real ownership model.
- Student receives only active/published, relevant, discoverable quizzes permitted by institutional/course rules. Drafts must never be included.
- Search must not broaden scope.
- Sorting must be deterministic. Prefer newest relevant records first unless current product behavior specifies otherwise.
- Add/verify indexes supporting title search, status/time filtering, ownership, course relations, and institutional scope.

### Quiz resource attributes required by current management UI

Return the existing quiz attributes and ensure these are available where relevant:

```ts
{
  chapter_id: number | null;
  course_id?: number;
  course_ids?: number[];
  courses?: CourseResource[];
  title: string;
  description?: string | null;
  type: 'exam' | 'homework';
  duration: number;
  total_marks: number;
  passing_marks: number;
  max_attempts: number;
  is_public: boolean;
  status: 'draft' | 'active';
  start_time: string | null;
  end_time: string | null;
  created_at: string | null;
  updated_at: string | null;
  questions?: QuizQuestionResource[];
}
```

Do not use `is_public` as a replacement for the explicit access model defined later.

### Validation and tests

Test:

- invalid page values;
- empty and trimmed title values;
- title matching;
- deterministic pagination;
- no records outside Doctor scope;
- no unrelated institution records;
- no Student draft records;
- scope remains enforced while searching;
- pagination metadata correctness.

## Phase 4 — Quiz Create and Update Multipart Contract

### Endpoints

```text
POST /v1/quiz
PUT or PATCH /v1/quiz/{quizId}
```

Use the HTTP method already supported by the repository, but document it accurately.

### Current frontend multipart fields

The frontend sends:

```text
course_ids[]=1
course_ids[]=2
course_id=1
chapter_id=optional
title=...
type=exam|homework
duration=number
total_marks=number
passing_marks=number
max_attempts=number
is_public=0|1
status=draft|active
start_time=optional datetime
end_time=optional datetime

questions[0][id]=existing ID or empty string
questions[0][text]=...
questions[0][type]=single_choice|multiple_choice|true_false|short_answer
questions[0][score]=number
questions[0][auto_correct]=0|1
questions[0][order]=1
questions[0][image]=optional image file

questions[0][answers][0][id]=existing ID or empty string
questions[0][answers][0][text]=...
questions[0][answers][0][is_correct]=0|1
questions[0][answers][0][reason]=optional text
questions[0][answers][0][image]=optional image file
questions[0][answers][0][reason_image]=optional image file
```

The frontend may send both `course_ids[]` and the first course as `course_id` for backward compatibility. Normalize these into the backend's canonical relation. Do not silently attach unauthorized courses.

### Required validation

- At least one authorized course is required unless the audited domain explicitly supports a no-course exam.
- `title`: required, trimmed, bounded length.
- `type`: enum `exam | homework`.
- `duration`: positive integer.
- `total_marks`: positive finite number.
- `passing_marks`: define and validate as a raw score; require `0 <= passing_marks <= total_marks`.
- `max_attempts`: positive integer.
- `status`: enum `draft | active`.
- `start_time` and `end_time`: valid datetimes; when both exist, end must be after start.
- `chapter_id`: nullable and must belong to one of the selected courses when supplied.
- Question text: required and bounded.
- Question type: allowed enum.
- Question score: finite non-negative number. If product rules require positive values, enforce that consistently and document it.
- Question order: positive integer; normalize duplicate/missing order values transactionally if necessary.
- For `single_choice`: require at least two answers and exactly one correct answer when auto-corrected.
- For `multiple_choice`: require at least two answers and at least one correct answer when auto-corrected.
- For `true_false`: require exactly two answers and exactly one correct answer when auto-corrected.
- For `short_answer`: follow the current backend grading model. Do not discard the expected answer if the existing domain stores one. If the current nested endpoint cannot accept it, document and implement the smallest compatible contract extension.
- Validate all existing nested IDs belong to the target quiz and parent question. Reject ID injection.
- Validate file MIME type, extension, size, and optional dimensions using the project's media policy.

### Transaction and synchronization behavior

- Create/update quiz, course relations, questions, answers, and media atomically where practical.
- Existing IDs update their matching entities only.
- Empty nested IDs create new entities.
- Nested IDs belonging to another quiz/question must return authorization or validation errors.
- Determine how removed questions/answers are represented. If the current frontend sends the full desired nested collection, safely delete or archive existing nested records absent from the submitted collection only after confirming this is the repository's established update behavior. Otherwise introduce explicit deletion fields and document them; do not guess.
- Return the canonical updated quiz resource, including nested questions, answers, reasons, and media URLs needed for edit hydration.

### Media preservation and removal

Required preservation rule:

- If an existing media field is omitted, preserve the current stored file and URL.
- If a new file is supplied, replace it and clean up the previous object safely.

Implement and document an explicit removal contract. Prefer one consistent pattern, for example:

```text
questions[0][remove_image]=1
questions[0][answers][0][remove_image]=1
questions[0][answers][0][remove_reason_image]=1
```

Alternatively, explicit `null` may be used only if multipart parsing and existing API conventions make it unambiguous. Do not treat an omitted file as deletion.

Storage cleanup must occur after a successful database mutation or through a reliable compensating job. Do not delete old files before the transaction is safely committed.

### Authorization

- Admin policy: permitted institutional scope.
- Doctor policy: ownership or assignment through the actual audited model.
- Students cannot create, edit, publish, delete, or attach nested content.
- A Doctor may not attach a quiz to a course outside the Doctor's management scope.

### Tests

Include create/update tests covering:

- multiple courses;
- chapter-course mismatch;
- all question types;
- unlimited practical question count without an arbitrary frontend-like cap;
- existing nested ID preservation;
- new nested entities;
- cross-quiz ID injection rejection;
- question image, answer image, and `reason_image` upload;
- omitted media preservation;
- media replacement;
- explicit media removal;
- transaction rollback after nested failure;
- unauthorized Doctor course/quiz mutation;
- active/draft status behavior.

## Phase 5 — Explicit Exam Access Model

Add an explicit authoritative enum:

```ts
type ExamAccessMode =
  | 'free'
  | 'standalone_paid'
  | 'course_included';
```

### Persistence

Implement a database field or normalized entitlement configuration that makes the mode explicit. A nullable legacy migration strategy is acceptable temporarily only if every existing row is backfilled deterministically through audited business rules and reviewed. Do not keep runtime inference from ambiguous fields as the permanent solution.

Recommended quiz fields/relationships:

```text
access_mode enum/string, non-null after migration
standalone activation/entitlement relation where applicable
course relation(s) for course_included exams
```

### Student-facing response fields

All Student quiz list/detail responses must include:

```ts
{
  access_mode: 'free' | 'standalone_paid' | 'course_included';
  can_access: boolean;
  access_denial_reason:
    | null
    | 'quiz_activation_required'
    | 'course_access_required'
    | 'not_relevant'
    | 'not_active'
    | 'not_started'
    | 'expired'
    | 'max_attempts_reached';
}
```

You may use different stable machine codes if the backend has an established error-code system, but document them and keep them consistent across endpoints.

### Access rules

- `free`: access does not require quiz or course purchase/activation, but status, schedule, relevance, and attempt limits still apply.
- `standalone_paid`: require entitlement/activation for that exact quiz. Course activation alone must not grant access unless product owners explicitly define that behavior.
- `course_included`: require access/enrollment/activation for at least one course to which the quiz belongs.
- Institutional relevance and active schedule apply to all modes.

### Enforcement points

Enforce the same policy on:

- Student quiz list and detail;
- start attempt;
- retrieve questions;
- submit/finish attempt;
- answer review;
- result detail.

Never rely on the UI's `can_access` check alone.

### Legacy fields

Keep `is_public` only for its audited publication/discoverability meaning. Keep `has_activation` only if required for backward compatibility, but derive it from authoritative entitlements and mark it deprecated in API docs. It must not determine `access_mode`.

### Tests

Cover all three modes, with and without valid entitlements, course access, schedule eligibility, relevance, and remaining attempts. Include direct endpoint access attempts that bypass the UI.

## Phase 6 — Student Relevance and Latest Exams

### Endpoint

Prefer a dedicated endpoint:

```text
GET /v1/student/exams/latest?limit=6
```

If repository conventions strongly favor another URI, use the equivalent and document it. Do not overload a global Admin/Doctor list in a way that weakens role behavior.

### Validation

```text
limit: optional integer, default 6, minimum 1, maximum 20
```

### Server-side relevance rules

Return only exams relevant to the authenticated Student based on the actual domain relationships:

- University;
- Faculty;
- Center;
- enrolled/activated/accessible courses;
- quiz status and schedule;
- any additional existing institutional restrictions.

The query must not fetch unrelated records and filter them after serialization. Apply scopes in SQL/query-builder/repository logic before retrieval.

### Sorting

Define “latest relevant” deterministically. Recommended order:

1. upcoming or currently available active exams by relevant schedule;
2. then most recently created/updated relevant exams;
3. stable ID tie-breaker.

Exclude drafts. Exclude expired exams unless the product explicitly wants result/review cards. Do not expose answers or unnecessary nested data.

### Response DTO

Return a compact resource sufficient for a Student Home widget:

```ts
{
  id: string;
  title: string;
  type: 'exam' | 'homework';
  duration: number;
  total_marks: number;
  passing_marks: number;
  start_time: string | null;
  end_time: string | null;
  course_id?: number;
  course_ids?: number[];
  course_title?: string | null;
  access_mode: ExamAccessMode;
  can_access: boolean;
  access_denial_reason: string | null;
}
```

### Tests

Test University, Faculty, Center, course enrollment, draft exclusion, schedule behavior, unrelated data non-disclosure, limit bounds, and access-decision fields.

## Phase 7 — Course Detail Exam Scoping

The course detail response consumed by Student Course Details includes `course.attributes.exams`.

Required behavior:

- Return only exams actually related to the requested course.
- Return only exams visible to the authenticated Student.
- Verify course access before returning protected course content.
- Exclude unrelated global exams and drafts.
- Include authoritative access fields on each exam.
- Do not include correct answers in normal course detail responses.

Add integration tests proving that exams from another course, Center, Faculty, or University are never included.

## Phase 8 — Authorized Admin and Doctor Exam Results

### Endpoint

Implement or verify:

```text
GET /v1/quiz/{quizId}/results
```

### Query

```text
page: integer >= 1
per_page: optional, safe maximum
student: optional safe search by permitted identifier/name
status: optional pass|fail|in_progress|submitted|graded as supported
from: optional date/datetime
to: optional date/datetime
```

Do not implement export until the product requires it. If export already exists, apply the exact same authorization and filters server-side.

### Authorization

- Admin must be permitted to view the quiz and its students within institutional scope.
- Doctor must own/manage the quiz under the real ownership model.
- Students cannot access this endpoint.
- Never fetch “all attempts” and rely on the frontend to filter by `quiz_id`.
- Prevent inference of unauthorized student identities or counts.

### Response

```json
{
  "data": [
    {
      "id": "attempt-id",
      "type": "quiz-results",
      "attributes": {
        "quiz_id": 123,
        "student": {
          "id": "student-id",
          "name": "Allowed display name",
          "email": "only if caller is permitted"
        },
        "attempt_number": 1,
        "score": 53,
        "total_score": 100,
        "percentage": 53,
        "passed": true,
        "status": "graded",
        "started_at": "ISO-8601",
        "finished_at": "ISO-8601",
        "time_taken": 3600
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 1,
    "summary": {
      "quiz_id": 123,
      "title": "Exam title",
      "total_marks": 100,
      "passing_score": 50,
      "passing_percentage": 50,
      "participants_count": 1,
      "attempts_count": 1,
      "average_percentage": 53,
      "passed_count": 1,
      "failed_count": 0
    }
  }
}
```

Adapt naming to existing resource conventions if needed, but preserve the information and document the final schema.

### Score rules

- Treat `passing_marks` as raw score unless the audited database proves otherwise.
- Expose explicit `passing_score` and calculated `passing_percentage` to remove ambiguity.
- `percentage = total_score > 0 ? clamp((score / total_score) * 100, 0, 100) : 0`.
- `average_percentage` must average normalized attempt percentages, not divide already-normalized values again.
- `passed` is server-authoritative.
- Define whether only finished/graded attempts contribute to aggregates; recommended: exclude in-progress attempts from pass/fail and average metrics, but include them in attempts count if useful. Document the decision.
- Handle zero/invalid totals safely and repair or reject corrupted records rather than returning values above 100.

### Database indexes

Add/verify indexes on:

```text
quiz_attempts.quiz_id
quiz_attempts.user_id/student_id
quiz_attempts.status
quiz_attempts.started_at
quiz_attempts.finished_at
```

Use composite indexes based on actual query plans.

### Tests

- Admin authorized scope.
- Doctor ownership scope.
- unauthorized quiz returns 403/404 according to project policy.
- quiz-specific pagination.
- student filters cannot escape scope.
- score, percentage, pass state, averages, zero totals, and values above expected totals.
- no student PII beyond caller permission.

## Phase 9 — Student Attempt and Review Security

Current known routes include:

```text
POST /v1/quiz-attempt
GET /v1/quiz-attempt/{id}
PUT /v1/quiz-attempt/{id}
```

Audit and harden them.

### Start attempt

Request:

```json
{ "quiz_id": 123 }
```

Before creating an attempt, enforce:

- authenticated Student role;
- quiz relevance;
- active/published status;
- schedule window;
- explicit access-mode entitlement;
- course access where required;
- standalone quiz activation where required;
- max-attempt policy;
- no duplicate concurrent attempt if prohibited.

Return stable machine-readable denial codes. A business-rule 403 must not be confused with an expired login session by the API contract.

### Attempt ownership

A Student may retrieve, submit, or review only their own attempts. Admin/Doctor access must use explicitly authorized management endpoints or policies.

### Submission and grading

The existing frontend has a legacy finish request shape containing `score` and `total_score`. This is not secure if the Student client can choose its own score.

Audit the real submission flow and change it so the backend calculates score from submitted answer IDs/text. The Student must submit answers, not authoritative score fields. If backward compatibility temporarily requires accepting `score` and `total_score`, ignore them for grading and compute canonical values server-side. Mark the legacy fields deprecated.

Recommended request concept:

```json
{
  "answers": [
    {
      "question_id": 1,
      "answer_ids": [10],
      "text": null
    }
  ]
}
```

Use the existing domain's actual answer storage model.

### Finish response

The frontend can consume:

```ts
{
  results: {
    score: number;
    total_score: number;
    percentage: number;
    passed: boolean;
    finished_at: string;
    time_taken: number;
  };
  attempts_remaining?: number | null;
  correct_answers?: Array<{
    question_text?: string | null;
    question_image?: string | null;
    correct_answer_ids?: Array<string | number> | null;
    correct_answers?: Array<{
      text?: string | null;
      image?: string | null;
      reason?: string | null;
      reason_image?: string | null;
    }> | null;
  }>;
}
```

Only include correct answers/reasons/media when the quiz policy permits review and the authenticated Student owns the attempt. Add `reason_image` to review serializers where stored.

## Phase 10 — AI Extraction Contract

The Next.js frontend proxy accepts:

```text
POST /api/ai-exam-extract
multipart/form-data:
  file: PDF, required, max 15 MB
  questions: optional positive integer
```

It forwards to an HTTPS service configured as `AI_EXAM_EXTRACT_URL` with a 60-second timeout.

If the backend repository owns the AI service, implement a stable authenticated endpoint. If it does not, provide configuration and documentation for the external service rather than mocking output.

### Required response envelope

The current frontend runtime parser expects:

```json
[
  {
    "output": [
      {
        "text": "Question text",
        "type": "single_choice",
        "score": 1,
        "auto_correct": true,
        "answers": [
          {
            "text": "Answer text",
            "is_correct": true,
            "reason": "Optional explanation"
          }
        ]
      }
    ]
  }
]
```

Supported question types:

```text
single_choice
multiple_choice
true_false
short_answer
```

Requirements:

- authenticate and authorize extraction usage;
- enforce rate limits and quotas;
- validate PDF MIME using content inspection where possible, not filename alone;
- maximum 15 MB unless the frontend and documentation are updated together;
- validate positive requested question count and enforce a safe upper operational bound;
- never return fabricated fallback questions;
- sanitize external errors;
- enforce response-size limits;
- validate every generated question and answer before returning;
- return no partial invalid objects unless the contract explicitly reports per-item errors.

For non-short-answer questions, return at least two valid answers. Return finite non-negative scores. Use boolean-compatible `auto_correct` and `is_correct` fields.

## Phase 11 — Draft Visibility and Scheduling

Apply consistent scopes across all quiz endpoints:

- Draft quizzes: Admin/authorized Doctor only.
- Active quizzes: still require relevance and access checks for Students.
- Before `start_time`: deny attempt start with a stable code.
- After `end_time`: deny new attempts; define whether existing attempts may finish and for how long.
- Direct detail endpoints must not leak drafts to Students.
- Question endpoints must not leak questions or correct answers before access is authorized.

Add tests for list, detail, start, submission, review, and management access.

## Phase 12 — OpenAPI and Contract Documentation

Update the backend's authoritative OpenAPI/API documentation for:

- `GET /v1/quiz` query parameters and paginated response.
- Quiz create/update multipart fields, nested IDs, validation, and media semantics.
- Explicit `access_mode`, `can_access`, and denial-code fields.
- Student latest relevant exams endpoint.
- Course detail exam scoping.
- Exam-scoped Admin/Doctor results endpoint.
- Attempt start denial responses.
- Secure answer submission and finish response.
- AI extraction endpoint or external service contract.

Include example requests/responses and all relevant 401, 403, 404, 409, and 422 responses.

## Required Database Work

After auditing existing schema, implement only the migrations actually needed. Likely work includes:

- explicit non-null quiz `access_mode` after safe backfill;
- standalone quiz entitlement/activation storage if not already present;
- indexes for quiz title/status/schedule/ownership/course relations;
- indexes for result queries;
- media fields for question image, answer image, and answer `reason_image` if missing;
- unambiguous raw score/total score fields if current schema mixes percentage and score;
- constraints or application-level validation preserving enum and score invariants.

Every migration must include rollback behavior and data-backfill tests or verification commands. Avoid destructive backfills without backups and explicit review.

## Required Automated Test Matrix

At minimum, add feature/integration tests for:

1. Admin quiz pagination and title search.
2. Doctor management scope.
3. Student scope by University, Faculty, Center, and enrolled course.
4. Draft exclusion.
5. All three access modes.
6. Quiz-specific versus course entitlement separation.
7. Schedule rules.
8. Attempt limits.
9. Secure server-side grading.
10. Results authorization and aggregates.
11. Multipart nested create/update.
12. Media preservation, replacement, and explicit removal.
13. Cross-parent nested ID injection rejection.
14. Course Details exam scoping.
15. Latest relevant exams non-disclosure.
16. AI PDF validation, rate limiting, timeout/error handling, and output validation.
17. API documentation/schema validation if the project supports it.

Use factories/fixtures that deliberately create unrelated Universities, Faculties, Centers, Doctors, courses, Students, quizzes, entitlements, and attempts to prove non-disclosure.

## Backward Compatibility and Rollout

- Keep existing frontend-consumed fields while adding explicit fields.
- Do not remove `is_public` or `has_activation` immediately if other clients use them. Mark ambiguous fields deprecated and document migration.
- If secure grading changes the attempt submission request, support a transition period but ignore client-supplied scores.
- Feature-flag access-mode enforcement only if needed for safe data backfill; do not leave the application indefinitely in mixed inference mode.
- Provide a deployment order:
  1. schema and indexes;
  2. data backfill;
  3. serializers and read contracts;
  4. policies and write enforcement;
  5. frontend integration enabling results/latest exams/access mode;
  6. remove deprecated inference paths after all clients migrate.

## Final Validation Commands

Run the backend repository's real equivalents of:

- formatter;
- static analysis/type checks;
- unit tests;
- feature/integration tests;
- security/authorization tests;
- migration dry run and rollback test;
- OpenAPI validation;
- production build/container build if applicable.

Do not claim completion while tests are failing.

## Required Final Report

Produce a final report with these exact sections:

1. **Backend Changes Completed**
   - Files, modules, migrations, endpoints, policies, DTOs/resources, and tests.
2. **Final API Contracts**
   - Exact endpoint, method, request/query, response, validation, and error codes.
3. **Authorization Matrix**
   - Admin, Doctor, Student access for list/detail/create/update/delete/start/submit/review/results.
4. **Database Changes**
   - Fields, indexes, constraints, backfills, and rollback notes.
5. **Backward Compatibility**
   - Deprecated fields and migration plan.
6. **Remaining Blockers**
   - Only genuine unresolved dependencies; do not list completed work.
7. **Validation Results**
   - Exact commands and pass/fail totals.
8. **Frontend Integration Notes**
   - State exactly when the frontend can safely enable:
     - Admin/Doctor results;
     - Student Home latest exams;
     - explicit access-mode logic;
     - existing-media removal UI.

## Definition of Done

The task is complete only when:

- quiz pagination/search is documented and role-scoped;
- nested multipart create/edit safely preserves all media;
- explicit media removal is documented and tested;
- `access_mode` is explicit and enforced at every protected endpoint;
- standalone quiz and course access are distinct;
- Student latest exams are relevance-scoped server-side;
- Course Details cannot expose unrelated exams;
- Admin/Doctor results are quiz-scoped and authorized;
- percentages and pass/fail are server-authoritative and bounded;
- Student scores are computed by the backend, not trusted from the client;
- drafts and correct answers cannot leak;
- AI extraction is real, authenticated, validated, and rate-limited;
- migrations, tests, and API docs pass;
- the final report contains the exact delivered contracts.

Begin with the repository/domain audit, then implement in dependency order. Do not stop after producing a plan: make the safe backend changes, run validation, and report any true blockers precisely.
