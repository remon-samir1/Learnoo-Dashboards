export interface ILibrary {
  id: string;
  type: "libraries";
  attributes: ILibraryAttributes;
}

export interface ILibraryAttributes {
  cover_image: string | null;
  title: string;
  course_id: number;
  description: string | null;
  material_type: "reference" | "guide" | string;
  code_activation: boolean;
  is_publish: boolean;
  is_locked: boolean;
  price: string;
  attachments: ILibraryAttachment[];
  created_at: string;
  updated_at: string;
}

export interface ILibraryAttachment {
  id: string;
  type: "attachments";
  attributes: ILibraryAttachmentAttributes;
}

export interface ILibraryAttachmentAttributes {
  name: string;
  path: string;
  extension: string;
  size: string;
  downloadable: boolean;
  created_at: string;
}