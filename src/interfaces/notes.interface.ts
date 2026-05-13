export interface IStudentNote {
  id: string | number;
  type?: string;
  attributes?: {
    title?: string | null;
    type: string | null;
    course_id?: number | string | null;
    course_title?: string | null;
    linked_lecture?: string | null;
    lecture_title?: string | null;
    content?: string | null;
    is_publish?: boolean | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
}