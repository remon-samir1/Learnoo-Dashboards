const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const compiled = ts.transpileModule(readFileSync(`${__dirname}/staff-activity.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const loaded = { exports: {} };
new Function('exports', compiled)(loaded.exports);
const { formatStaffActivity: format } = loaded.exports;

test('client login and lecture examples have readable bilingual labels', () => {
  assert.equal(format('POST v1/auth/login', 'ar'), 'تسجيل دخول');
  assert.equal(format('POST v1/auth/login', 'en'), 'Signed in');
  assert.equal(format('POST v1/lecture', 'ar'), 'إضافة محاضرة');
  assert.equal(format('POST v1/lecture', 'en'), 'Create lecture');
  assert.equal(format('POST v1/student', 'ar'), 'إضافة حساب مستخدم');
});

test('resource updates and deletions hide numeric and ULID identifiers', () => {
  assert.equal(format('PATCH /api/v1/course/123?source=dashboard', 'ar'), 'تعديل دورة');
  assert.equal(format('DELETE v1/student/01m4xsdmyvgpesc873pzeghed8', 'en'), 'Delete user account');
  assert.equal(format('PUT v1/live-room/139', 'ar'), 'تعديل جلسة بث مباشر');
});

test('custom actions describe what happened instead of pretending every POST creates content', () => {
  assert.equal(format('POST v1/owner/device-transfers/01ky3bkhbsmnsqmqcm7c5fzw6d/approve', 'ar'), 'اعتماد الجهاز الجديد');
  assert.equal(format('POST v1/owner/device-transfers/01ky3bkhbsmnsqmqcm7c5fzw6d/reset', 'ar'), 'السماح للطالب بتغيير الجهاز وإلغاء الجلسات السابقة');
  assert.equal(format('POST v1/owner/device-transfers/01ky3bkhbsmnsqmqcm7c5fzw6d/reset', 'en'), 'Allowed a student device change and revoked previous sessions');
  assert.equal(format('POST v1/chapter/711/copy', 'en'), 'Copied a lesson');
  assert.equal(format('POST v1/chapter/711/retry-conversion', 'ar'), 'إعادة معالجة فيديو');
  assert.equal(format('POST v1/notifications/send', 'ar'), 'إرسال إشعار للطلاب');
  assert.equal(format('PATCH v1/notifications/read-all', 'en'), 'Marked all notifications as read');
  assert.equal(format('POST v1/feature/store-or-update', 'ar'), 'تحديث إعدادات الميزات');
});

test('unknown actions remain readable without exposing endpoint codes', () => {
  assert.equal(format('POST v1/new-resource/123', 'ar'), 'إجراء على المنصة');
  assert.equal(format('unexpected', 'en'), 'Platform action');
});
