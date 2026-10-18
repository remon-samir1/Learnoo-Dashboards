"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { FileUp, Loader2, X } from "lucide-react";
import { validateExamQuestions, type ExamFormQuestion } from "@/src/lib/exam-form";
import type { ImportedExam } from "@/src/lib/exam-import";

export function ExamFileImport({ onApply }: { onApply: (questions: ExamFormQuestion[], title: string) => void }) {
  const ar = useLocale() === "ar";
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [exam, setExam] = useState<ImportedExam | null>(null);
  const [title, setTitle] = useState("");
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const questions = exam?.questions.slice(0, count) ?? [];
  const question = questions[index];
  const invalid = questions.flatMap((question, index) => (validateExamQuestions([question]).firstInvalid || (question.type !== "short_answer" && (question.answers.length < 2 || question.answers.filter(answer => answer.isCorrect).length !== 1))) ? [index] : []);
  const fieldStyle = "w-full rounded-lg border border-slate-300 bg-white p-3 text-sm";

  useEffect(() => {
    if (open) dialog.current?.showModal(); else dialog.current?.close();
  }, [open]);

  async function read(file?: File) {
    if (!file) return;
    setError(""); setExam(null); setBusy(true);
    try {
      if (file.size > 10_000_000) throw new Error("IMPORT_SIZE_LIMIT");
      if (!/\.(docx|pdf)$/i.test(file.name)) throw new Error("INVALID_IMPORT_FILE");
      const data = await file.arrayBuffer();
      const result = /\.docx$/i.test(file.name)
        ? await (await import("@/src/lib/exam-import")).readWordExam(data)
        : await (await import("@/src/lib/exam-import-pdf")).readPdfExam(data);
      setExam(result); setIndex(0); setCount(result.questions.length);
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    } catch (error) {
      const messages: Record<string, string> = {
        IMPORT_SIZE_LIMIT: ar ? "حجم الملف أكبر من ١٠ ميجا. قسّمه إلى ملفات أصغر." : "The file exceeds 10 MB. Split it into smaller files.",
        IMPORT_PAGE_LIMIT: ar ? "الملف أكثر من ٢٥ صفحة. قسّمه إلى ملفات أصغر." : "The file exceeds 25 pages. Split it into smaller files.",
        IMPORT_NO_TEXT: ar ? "ملف PDF لا يحتوي على نص قابل للقراءة. استخدم نسخة Word أو PDF نصي." : "The PDF has no readable text. Use Word or a text PDF.",
        NO_IMPORTABLE_QUESTIONS: ar ? "لم نعثر على أسئلة بالتنسيق المدعوم. استخدم أسئلة مرقّمة مع خيارات، أو عبارات صح وخطأ بعلامة ✓ أو ✗." : "No supported questions found. Use numbered questions with options, or true/false statements marked ✓ or ✗.",
      };
      setError(messages[error instanceof Error ? error.message : ""] ?? (ar ? "تعذّر قراءة الملف. استخدم Word بصيغة docx أو PDF نصي سليم، ثم حاول مجددًا." : "Could not read the file. Use a valid .docx file or text PDF and try again."));
    } finally { setBusy(false); }
  }

  function updateQuestion(value: Partial<ExamFormQuestion>) {
    setExam(current => current && ({ ...current, questions: current.questions.map((question, qi) => qi === index ? { ...question, ...value } : question) }));
  }

  return <>
    <button type="button" onClick={() => { setExam(null); setError(""); setOpen(true); }} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
      <FileUp size={16} />{ar ? "استيراد أسئلة Word / PDF" : "Import Word / PDF questions"}
    </button>
    <dialog ref={dialog} onCancel={event => { if (busy) event.preventDefault(); else setOpen(false); }} aria-labelledby="exam-import-title" dir={ar ? "rtl" : "ltr"} className="font-sans m-auto max-h-[90dvh] w-[min(95vw,48rem)] overflow-auto rounded-2xl p-6 shadow-xl backdrop:bg-black/50">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="exam-import-title" className="text-lg font-bold">{ar ? "مراجعة الأسئلة قبل الحفظ" : "Review questions before saving"}</h2>
        <button type="button" disabled={busy} onClick={() => setOpen(false)} aria-label={ar ? "إغلاق" : "Close"}><X size={20} /></button>
      </div>
      <p className="mb-3 text-sm text-slate-600">{ar ? "استيراد الأسئلة الموجودة في الملف دون ذكاء اصطناعي. راجع النصوص والإجابات قبل إضافتها. Word أدق للحفاظ على النص العربي." : "Import existing questions without AI. Review text and answers before applying. Word preserves Arabic text more accurately."}</p>
      <label className="block text-sm font-semibold">{ar ? "ملف الأسئلة" : "Question file"}
        <input type="file" accept=".docx,.pdf" disabled={busy} onChange={event => { void read(event.target.files?.[0]); }} className={`${fieldStyle} mt-2`} />
      </label>
      {busy && <p role="status" className="mt-3 flex items-center gap-2"><Loader2 size={16} className="animate-spin" />{ar ? "جارٍ قراءة الملف..." : "Reading file..."}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {exam && <div className="mt-4 space-y-4">
        <label className="block text-sm font-semibold">{ar ? `عدد الأسئلة المستوردة (من ${exam.questions.length})` : `Questions to import (of ${exam.questions.length})`}
          <input type="number" min={1} max={exam.questions.length} value={count} onChange={event => { const next = Math.max(1, Math.min(exam.questions.length, Number(event.target.value) || 1)); setCount(next); setIndex(Math.min(index, next - 1)); }} className={`${fieldStyle} mt-2`} />
        </label>
        {invalid.length > 0 && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          {ar ? `${invalid.length} سؤال يحتاج إكمال النص أو الخيارات أو تحديد الإجابة الصحيحة.` : `${invalid.length} questions need text, options, or a correct answer.`}
          <button type="button" onClick={() => setIndex(invalid[0])} className="mx-2 underline">{ar ? "عرض أول سؤال ناقص" : "Show first incomplete question"}</button>
        </p>}
        {question && <section className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm">{ar ? "السؤال" : "Question"} <select aria-label={ar ? "اختر السؤال" : "Select question"} value={index} onChange={event => setIndex(Number(event.target.value))} className="rounded border p-2">
              {questions.map((q, qi) => <option key={q.id} value={qi}>{qi + 1}{invalid.includes(qi) ? " *" : ""}</option>)}
            </select> / {count}</label>
            <span className="text-xs text-slate-500">{question.type === "short_answer" ? (ar ? "مقالي — تصحيح يدوي" : "Essay — manual grading") : question.type === "true_false" ? (ar ? "صح / خطأ" : "True / false") : (ar ? "اختيار من متعدد" : "Multiple choice")}</span>
          </div>
          <label className="block text-sm font-semibold">{ar ? "نص السؤال" : "Question text"}<textarea aria-label={ar ? "نص السؤال" : "Question text"} dir="auto" value={question.text} onChange={event => updateQuestion({ text: event.target.value })} rows={4} className={`${fieldStyle} mt-2`} /></label>
          {exam.contexts.length > 0 && <details className="rounded-lg bg-slate-50 p-3 text-sm"><summary>{ar ? "حالات مشتركة: أضف الحالة للأسئلة المرتبطة بها" : "Shared cases: add the case to related questions"}</summary>
            {exam.contexts.map((context, ci) => <div key={ci} className="mt-3"><p dir="auto" className="whitespace-pre-wrap">{context}</p><button type="button" disabled={question.text.includes(context)} onClick={() => updateQuestion({ text: `${context}\n\n${question.text}` })} className="mt-2 text-blue-700 underline">{ar ? "إضافة لهذا السؤال" : "Add to this question"}</button></div>)}
          </details>}
          {question.answers.map((answer, ai) => <div key={answer.id} className="flex items-start gap-3">
            <label className="mt-3 flex items-center gap-1 text-xs"><input type="radio" name={`import-correct-${question.id}`} aria-label={ar ? `الإجابة الصحيحة ${ai + 1}` : `Correct answer ${ai + 1}`} checked={answer.isCorrect} onChange={() => updateQuestion({ answers: question.answers.map((answer, i) => ({ ...answer, isCorrect: i === ai })) })} />{ar ? "صحيحة" : "Correct"}</label>
            <label className="min-w-0 flex-1 text-sm">{ar ? `الخيار ${ai + 1}` : `Option ${ai + 1}`}<textarea aria-label={ar ? `الخيار ${ai + 1}` : `Option ${ai + 1}`} dir="auto" value={answer.text} onChange={event => updateQuestion({ answers: question.answers.map((answer, i) => i === ai ? { ...answer, text: event.target.value } : answer) })} rows={2} className={`${fieldStyle} mt-1`} /></label>
          </div>)}
          {question.answers.some(answer => answer.reason.trim()) && <label className="block text-sm">{ar ? "توضيح الإجابة" : "Answer explanation"}<textarea aria-label={ar ? "توضيح الإجابة" : "Answer explanation"} dir="auto" value={question.answers.find(answer => answer.reason.trim())?.reason ?? ""} onChange={event => updateQuestion({ answers: question.answers.map(answer => ({ ...answer, reason: event.target.value })) })} className={`${fieldStyle} mt-1`} /></label>}
          <div className="flex justify-between"><button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)} className="text-blue-700 disabled:text-slate-400">{ar ? "السابق" : "Previous"}</button><button type="button" disabled={index >= count - 1} onClick={() => setIndex(index + 1)} className="text-blue-700 disabled:text-slate-400">{ar ? "التالي" : "Next"}</button></div>
        </section>}
        <p className="text-sm text-amber-800">{ar ? "سيتم استبدال الأسئلة الحالية بعد تأكيدك. لن يُحفظ الامتحان إلا عند الضغط على حفظ في الصفحة." : "Applying replaces the current questions. The exam is only saved when you click Save on the page."}</p>
        <button type="button" disabled={invalid.length > 0 || !questions.length} onClick={() => { onApply(questions, title); setOpen(false); }} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{ar ? "تأكيد المراجعة وإضافة الأسئلة" : "Confirm review and apply questions"}</button>
      </div>}
    </dialog>
  </>;
}
