const actions: Record<string, readonly [string, string]> = {
  'POST auth/login': ['تسجيل دخول', 'Signed in'],
  'POST auth/logout': ['تسجيل خروج', 'Signed out'],
  'POST auth/register': ['إنشاء حساب', 'Created an account'],
  'PUT auth/update': ['تعديل بيانات الحساب', 'Updated account details'],
  'POST auth/device-transfer': ['طلب نقل الحساب إلى جهاز جديد', 'Requested a device transfer'],
  'DELETE auth/account': ['طلب حذف الحساب', 'Requested account deletion'],
  'POST auth/account/restore': ['إلغاء طلب حذف الحساب', 'Cancelled account deletion'],
  'DELETE auth/tokens': ['إلغاء رموز الوصول', 'Revoked access tokens'],
  'DELETE auth/tokens/:id': ['إلغاء رمز وصول', 'Revoked an access token'],
  'POST auth/email/verification-notification': ['طلب رمز تأكيد البريد الإلكتروني', 'Requested an email verification code'],
  'POST auth/phone/verification-notification': ['طلب رمز تأكيد الهاتف', 'Requested a phone verification code'],
  'POST auth/email/verify': ['تأكيد البريد الإلكتروني', 'Verified email address'],
  'POST auth/phone/verify': ['تأكيد رقم الهاتف', 'Verified phone number'],
  'POST chapter/:id/copy': ['نسخ درس', 'Copied a lesson'],
  'POST chapter/:id/view': ['تسجيل مشاهدة درس', 'Recorded a lesson view'],
  'POST chapter/:id/retry-conversion': ['إعادة معالجة فيديو', 'Retried video processing'],
  'POST quiz-user-answer/:id/evaluate': ['تصحيح إجابة امتحان', 'Graded an exam answer'],
  'POST quiz-user-answer': ['تسجيل إجابة امتحان', 'Submitted an exam answer'],
  'POST quiz-attempt': ['بدء محاولة امتحان', 'Started an exam attempt'],
  'POST owner/device-transfers/:id/approve': ['اعتماد الجهاز الجديد', 'Approved a new device'],
  'POST owner/device-transfers/:id/reset': ['السماح للطالب بتغيير الجهاز وإلغاء الجلسات السابقة', 'Allowed a student device change and revoked previous sessions'],
  'POST timetable/:id/documents': ['رفع ملف إلى الجداول والمستندات', 'Uploaded a schedule document'],
  'POST ai-exam': ['طلب إنشاء امتحان بالذكاء الاصطناعي', 'Requested AI exam generation'],
  'POST code/activate': ['تفعيل محتوى باستخدام كود', 'Activated content using a code'],
  'POST code/refresh': ['تحديث أكواد التفعيل', 'Refreshed activation codes'],
  'POST post/:id/react': ['تحديث التفاعل على منشور', 'Updated a post reaction'],
  'POST user-progress': ['تحديث تقدم الطالب', 'Updated student progress'],
  'POST student-archives/:id': ['تحديث حالة حساب محذوف', 'Updated a deleted account'],
  'POST student/:id/remove-activation': ['إلغاء تفعيل محتوى لحساب طالب', 'Removed a student activation'],
  'POST parent/students': ['ربط طالب بولي أمر', 'Linked a student to a parent'],
  'PATCH feedback/:id/read': ['تحديد رسالة تواصل كمقروءة', 'Marked a message as read'],
  'POST feature/store-or-update': ['تحديث إعدادات الميزات', 'Updated feature settings'],
  'POST pre-activation/upload': ['استيراد قائمة تفعيلات مسبقة', 'Imported pre-activations'],
  'POST pre-activation/process': ['تطبيق التفعيلات المسبقة', 'Applied pre-activations'],
  'POST ota/upload': ['رفع نسخة جديدة من التطبيق', 'Uploaded an app release'],
  'PATCH notifications/:id/read': ['تحديد إشعار كمقروء', 'Marked a notification as read'],
  'PATCH notifications/read-all': ['تحديد جميع الإشعارات كمقروءة', 'Marked all notifications as read'],
  'POST notifications/send': ['إرسال إشعار للطلاب', 'Sent a student notification'],
  'POST test-notification': ['اختبار إرسال إشعار', 'Tested a notification'],
  'POST test-quiz-notification': ['اختبار إشعار امتحان', 'Tested an exam notification'],
  'POST test-course-notification': ['اختبار إشعار دورة', 'Tested a course notification'],
  'POST test-login-notification': ['اختبار إشعار تسجيل الدخول', 'Tested a sign-in notification'],
  'POST test-registration-notification': ['اختبار إشعار إنشاء حساب', 'Tested an account notification'],
};

const resources: Record<string, readonly [string, string]> = {
  university: ['جامعة', 'university'], faculty: ['كلية', 'faculty'], center: ['سنتر', 'center'],
  department: ['قسم أو ترم', 'department or term'], course: ['دورة', 'course'], lecture: ['محاضرة', 'lecture'],
  chapter: ['درس', 'lesson'], note: ['ملاحظة أو ملخص', 'note or summary'], attachment: ['مرفق', 'attachment'],
  discussion: ['نقاش', 'discussion'], library: ['عنصر في المكتبة الإلكترونية', 'library item'],
  quiz: ['امتحان', 'exam'], 'quiz-attempt': ['محاولة امتحان', 'exam attempt'],
  'quiz-question': ['سؤال امتحان', 'exam question'], 'quiz-answer': ['خيار إجابة', 'answer option'],
  'quiz-user-answer': ['إجابة طالب', 'student answer'], 'live-room': ['جلسة بث مباشر', 'live session'],
  code: ['كود تفعيل', 'activation code'], post: ['منشور أو تعليق', 'post or comment'],
  student: ['حساب مستخدم', 'user account'], 'social-link': ['رابط تواصل', 'social link'],
  feedback: ['رسالة تواصل', 'message'], feature: ['إعداد ميزة', 'feature setting'],
  'pre-activation': ['تفعيل مسبق', 'pre-activation'], ota: ['نسخة تطبيق', 'app release'],
  notifications: ['إشعار', 'notification'], issues: ['طلب دعم', 'support request'],
};

export function formatStaffActivity(action: string, locale: string): string {
  const language = locale === 'ar' ? 0 : 1;
  const [method, rawPath = ''] = action.trim().split(/\s+/);
  const path = rawPath.split(/[?#]/)[0].replace(/^\/?(?:api\/)?v1\//, '').replace(/\/$/, '');
  const normalized = path.replace(/\/(?:\d+|[a-z0-9]{26}|[a-f0-9-]{36})(?=\/|$)/gi, '/:id');
  const message = actions[`${method.toUpperCase()} ${normalized}`];
  if (message) return message[language];
  const resource = resources[path.split('/')[0]];
  const verb = ({ POST: ['إضافة', 'Create'], PUT: ['تعديل', 'Update'], PATCH: ['تعديل', 'Update'], DELETE: ['حذف', 'Delete'] } as Record<string, string[]>)[method.toUpperCase()];
  return resource && verb ? `${verb[language]} ${resource[language]}` : ['إجراء على المنصة', 'Platform action'][language];
}
