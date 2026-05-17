import type { ApiListResponse, Attachment, JsonApiData, MaterialType } from '@/src/types';

export type { MaterialType };

export type LibraryAttachment = Attachment;

export type LibraryItem = JsonApiData<LibraryItemAttributes>;

export type LibraryResponse = ApiListResponse<LibraryItem>;

export type LibraryItemAttributes = {
  cover_image: string | null;
  title: string;
  course_id: number;
  description: string | null;
  material_type: MaterialType;
  code_activation: boolean;
  is_publish: boolean;
  is_locked: boolean;
  price: string;
  attachments: LibraryAttachment[];
  created_at: string | null;
  updated_at: string | null;
};
