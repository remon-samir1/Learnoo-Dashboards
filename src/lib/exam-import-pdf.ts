import { finishImportedExam, importedQuestion, importedTrueFalseQuestion, type ImportedExam } from "./exam-import";
import type { ExamFormQuestion } from "./exam-form";

export async function readPdfExam(data: ArrayBuffer): Promise<ImportedExam> {
  // shortcut: reads numbered text PDFs with lettered options; scanned PDFs need a separate OCR importer.
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data }).promise;
  if (doc.numPages > 25) { await doc.destroy(); throw new Error("IMPORT_PAGE_LIMIT"); }
  const questions: ExamFormQuestion[] = [];
  let current: ExamFormQuestion | undefined;
  let columns: { right: number; answer: ExamFormQuestion["answers"][number] }[] = [];
  let mode: "choice" | "true_false" | "essay" = "choice";
  let hasText = false;
  const flush = () => { if (current) questions.push(current); current = undefined; columns = []; };
  try {
    for (let pi = 1; pi <= doc.numPages; pi++) {
      const page = await doc.getPage(pi);
      const viewport = page.getViewport({ scale: 1.5 });
      if (viewport.width * viewport.height > 20_000_000) throw new Error("INVALID_IMPORT_FILE");
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      const content = await page.getTextContent();
      const items = content.items.filter((item): item is import("pdfjs-dist/types/src/display/api").TextItem => "str" in item && !!item.str.trim());
      hasText ||= items.length > 0;
      const lines: typeof items[] = [];
      for (const item of items.sort((a, b) => b.transform[5] - a.transform[5] || b.transform[4] - a.transform[4])) {
        const line = lines.find(line => Math.abs(line[0].transform[5] - item.transform[5]) < 3);
        if (line) line.push(item); else lines.push([item]);
      }
      for (const line of lines) {
        if (line[0].transform[5] > page.view[3] - 45 || line[0].transform[5] < 40) continue;
        const tokens = line.sort((a, b) => b.transform[4] - a.transform[4]).map(item => {
          const transform = pdfjs.Util.transform(viewport.transform, item.transform);
          const x = Math.max(0, Math.floor(transform[4])), y = Math.max(0, Math.floor(transform[5] - item.height * 1.5));
          const width = Math.min(canvas.width - x, Math.max(1, Math.ceil(item.width * 1.5)));
          const height = Math.min(canvas.height - y, Math.max(1, Math.ceil(item.height * 1.5)));
          const pixels = ctx.getImageData(x, y, width, height).data;
          let gray = 0, red = 0, ink = 0;
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
            if (r > 160 && r < 210 && Math.abs(r - g) < 5 && Math.abs(r - b) < 5) gray++;
            if (r > 120 && r > g * 1.8 && r > b * 1.8) red++;
            if (r < 100 && g < 100 && b < 100) ink++;
          }
          return { text: item.str.replace(/\uf0fc/g, "✓").replace(/\uf0fb/g, "✘"), right: item.transform[4] + item.width, correct: gray > pixels.length / 4 * 0.35, red: red > 3 && red > ink };
        });
        const raw = tokens.map(token => token.text).join(" ").replace(/\s+/g, " ").trim();
        if (/السؤال/.test(raw)) {
          flush();
          mode = /خطأ/.test(raw) ? "true_false" : /اختر|إختر|االجابة/.test(raw) ? "choice" : "essay";
          continue;
        }
        if (/العبارة|العلامة|موارد بشرية.*الفرقة|انتظام$|انتساب$/.test(raw)) continue;
        const numbered = /^[\d٠-٩]+\s*[.)]/u.test(raw);
        const marked = /\(\s*[✓✔✘✕×✗]\s*\)\s*$/u.test(raw);
        if (mode === "true_false" || (marked && (numbered || !current || current.type === "true_false"))) {
          if (numbered || marked) {
            flush();
            const clean = tokens.filter(token => !token.red).map(token => token.text.replace(/[✓✔✘✕×✗]/g, "")).join(" ");
            const reason = tokens.filter(token => token.red).map(token => token.text).join(" ");
            current = importedTrueFalseQuestion(clean.replace(/\(\s*\)\s*$/, ""), raw, reason);
          } else if (current) {
            current.text += " " + tokens.filter(token => !token.red && !/[✓✔✘✕×✗]/.test(token.text)).map(token => token.text).join(" ");
            const reason = tokens.filter(token => token.red).map(token => token.text).join(" ");
            current.answers.forEach(answer => { answer.reason += " " + reason; });
          }
          continue;
        }
        if (numbered) {
          flush(); current = importedQuestion(raw, mode === "essay" ? "short_answer" : "single_choice");
        } else if (current && mode === "choice") {
          for (const token of tokens.sort((a, b) => b.right - a.right)) {
            const value = token.text.trim();
            const match = value.match(/^\(?([أابجد])(?:\s*[).]\s*|\s+)(.*)$/u) ?? value.match(/^([أابجد])$/u);
            if (match && ("أبجد".indexOf(match[1] === "ا" ? "أ" : match[1]) === current.answers.length)) {
              const answer = { id: "", text: match[2] ?? "", isCorrect: token.correct, reason: "" };
              current.answers.push(answer);
              const column = columns.find(column => Math.abs(column.right - token.right) < 20);
              if (column) { column.right = token.right; column.answer = answer; }
              else columns.push({ right: token.right, answer });
              columns.sort((a, b) => a.right - b.right);
            } else if (current.answers.length) {
              const answer = (columns.find(column => column.right >= token.right - 15) ?? columns.at(-1))!.answer;
              if (value !== ")") answer.text = `${answer.text} ${value}`.trim();
              answer.isCorrect ||= token.correct;
            } else current.text += " " + value;
          }
        } else if (current) current.text += " " + raw;
      }
      canvas.width = canvas.height = 0;
    }
    flush();
    if (!hasText) throw new Error("IMPORT_NO_TEXT");
    return finishImportedExam(questions);
  } finally { await doc.destroy(); }
}
