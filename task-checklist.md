# Doctor Dashboard i18n Coverage - Task Checklist

- [x] Read all source files (dashboard, courses, lectures, chapters, levels, settings/profile)
- [x] Verify existing translation keys in both en.json and ar.json
- [ ] **HIGH: Fix `courses/page.tsx`** - CourseListView hardcoded strings + pass `t` prop
- [ ] **HIGH: Convert `dashboard/page.tsx`** - All hardcoded text to `doctorDashboard.*` keys
- [ ] **MEDIUM: Convert `lectures/page.tsx`** - All hardcoded text to `lectures.*` keys
- [ ] **MEDIUM: Convert `chapters/page.tsx`** - All hardcoded text to `chapters.*` keys
- [ ] **MEDIUM: Convert `settings/profile/page.tsx`** - All hardcoded text to `settings.profile.*` keys
- [ ] **LOW: Convert `levels/page.tsx`** - All hardcoded text to `levels.*` keys
- [ ] **VERIFY: Search for remaining hardcoded English in JSX across `app/(doctor)/doctor/`**