import type { ExamFormQuestion, ExamFormQuestionType } from "./exam-form";

export interface ImportedExam {
  questions: ExamFormQuestion[];
  review: number[];
  contexts: string[];
}

const WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const OPTION = /^\(?([أابجدA-D])(?:\s*[)）.:-]\s*|\s+)/u;

export function importedQuestion(text: string, type: ExamFormQuestionType, answers: { text: string; isCorrect: boolean; reason?: string }[] = []): ExamFormQuestion {
  return {
    id: "", text: text.trim().replace(/^[\d٠-٩]+\s*[.、)]\s*/u, ""), type, score: 1,
    autoCorrect: type !== "short_answer", image: null, imagePreview: "",
    answers: answers.map(answer => ({ id: "", text: answer.text.trim(), isCorrect: answer.isCorrect, reason: answer.reason ?? "" })),
  };
}

export function finishImportedExam(questions: ExamFormQuestion[], contexts: string[] = []): ImportedExam {
  if (!questions.length || questions.length > 500) throw new Error("NO_IMPORTABLE_QUESTIONS");
  const stamp = Date.now();
  const review: number[] = [];
  questions.forEach((question, index) => {
    question.id = `new-import-${stamp}-${index}`;
    question.answers.forEach((answer, ai) => { answer.id = `a-import-${stamp}-${index}-${ai}`; });
    const correct = question.answers.filter(answer => answer.isCorrect).length;
    if (!question.text || (question.type !== "short_answer" && (correct !== 1 || question.answers.length < 2 || question.answers.some(answer => !answer.text)))) review.push(index + 1);
  });
  return { questions, review, contexts };
}

export function parseWordExam(xml: string): ImportedExam {
  if (xml.length > 20_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("INVALID_IMPORT_FILE");
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const body = doc.getElementsByTagNameNS(WORD_NS, "body")[0];
  if (!body || doc.getElementsByTagName("parsererror").length) throw new Error("INVALID_IMPORT_FILE");
  const text = (element: Element, excludeRed = false) => (element.localName === "r" ? [element] : Array.from(element.getElementsByTagNameNS(WORD_NS, "r"))).map(run => {
    if (excludeRed && Array.from(run.getElementsByTagNameNS(WORD_NS, "color")).some(color => color.getAttributeNS(WORD_NS, "val")?.toUpperCase() === "FF0000")) return "";
    return Array.from(run.getElementsByTagNameNS(WORD_NS, "t")).map(node => node.textContent ?? "").join("")
      + Array.from(run.getElementsByTagNameNS(WORD_NS, "sym")).map(node => ({ F0FC: "✓", F0FB: "✘" })[node.getAttributeNS(WORD_NS, "char") as "F0FC" | "F0FB"] ?? "").join("");
  }).join("").trim();
  const questions: ExamFormQuestion[] = [];
  let pending: string[] = [];
  const contexts: string[] = [];
  let essay = false;
  for (const block of Array.from(body.children)) {
    if (block.localName === "p") {
      const value = text(block);
      if (!value) continue;
      if (/^السؤال/.test(value)) {
        pending = [];
        essay = !/اختر|إختر|صح|خطأ/.test(value);
        const colon = value.indexOf(":");
        if (essay && colon >= 0 && value.slice(colon + 1).trim()) questions.push(importedQuestion(value.slice(colon + 1), "short_answer"));
      } else if (essay) {
        questions.push(importedQuestion(value, "short_answer"));
      } else {
        pending.push(value);
      }
      continue;
    }
    if (block.localName !== "tbl") continue;
    const rows = Array.from(block.children).filter(row => row.localName === "tr");
    const cells = rows.flatMap(row => Array.from(row.children).filter(cell => cell.localName === "tc"));
    if (/العلامة/.test(text(rows[0]))) {
      for (const row of rows.slice(1)) {
        const parts = Array.from(row.children).filter(cell => cell.localName === "tc");
        const statement = parts[1];
        if (!statement) continue;
        const mark = parts[2] ? text(parts[2]) : "";
        const full = text(statement);
        const clean = text(statement, true);
        const reason = full !== clean ? Array.from(statement.getElementsByTagNameNS(WORD_NS, "r")).filter(run => Array.from(run.getElementsByTagNameNS(WORD_NS, "color")).some(color => color.getAttributeNS(WORD_NS, "val")?.toUpperCase() === "FF0000")).map(run => text(run)).join("") : "";
        questions.push(importedQuestion(clean, "true_false", [
          { text: "صح", isCorrect: /[✓✔]/.test(mark), reason },
          { text: "خطأ", isCorrect: /[✘✕×✗]/.test(mark), reason },
        ]));
      }
    } else {
      if (pending.length > 1) contexts.push(pending.slice(0, -1).join("\n"));
      const stem = pending.at(-1) ?? "";
      const answers = cells.map(cell => {
        const value = text(cell);
        const shaded = Array.from(cell.getElementsByTagNameNS(WORD_NS, "shd")).some(shade => {
          const fill = shade.getAttributeNS(WORD_NS, "fill")?.toUpperCase();
          return fill && !["AUTO", "FFFFFF", "000000"].includes(fill);
        });
        const highlighted = Array.from(cell.getElementsByTagNameNS(WORD_NS, "highlight")).some(mark => !["none", "white"].includes(mark.getAttributeNS(WORD_NS, "val") ?? "none"));
        return { text: value.replace(OPTION, ""), isCorrect: shaded || highlighted };
      });
      if (answers.some(answer => answer.text) && pending.length) questions.push(importedQuestion(stem, "single_choice", answers));
    }
    pending = [];
  }
  return finishImportedExam(questions, contexts);
}

export async function readWordExam(data: ArrayBuffer): Promise<ImportedExam> {
  const bytes = new Uint8Array(data);
  const view = new DataView(data);
  let expanded = 0;
  for (let i = 0; i + 46 <= bytes.length; i++) {
    if (view.getUint32(i, true) !== 0x02014b50) continue;
    expanded += view.getUint32(i + 24, true);
    if (expanded > 50_000_000) throw new Error("INVALID_IMPORT_FILE");
    i += 45 + view.getUint16(i + 28, true) + view.getUint16(i + 30, true) + view.getUint16(i + 32, true);
  }
  const { CFB } = await import("xlsx");
  const archive = CFB.read(bytes, { type: "array" });
  const index = archive.FullPaths.indexOf("Root Entry/word/document.xml");
  if (index < 0) throw new Error("INVALID_IMPORT_FILE");
  return parseWordExam(new TextDecoder().decode(new Uint8Array(archive.FileIndex[index].content)));
}
