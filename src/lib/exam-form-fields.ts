import type { LucideIcon } from 'lucide-react';
import type { ExamFormDetails } from '@/src/lib/exam-form';

export type ExamNumberFieldKey =
  | 'duration'
  | 'totalMarks'
  | 'passingMarks'
  | 'maxAttempts';

export type ExamDateFieldKey = 'startTime' | 'endTime';

export interface ExamNumberField {
  label: string;
  icon: LucideIcon;
  key: ExamNumberFieldKey;
  min: number;
}

export interface ExamDateField {
  label: string;
  key: ExamDateFieldKey;
}

export function readExamField(details: ExamFormDetails, key: ExamNumberFieldKey | ExamDateFieldKey) {
  return details[key];
}
