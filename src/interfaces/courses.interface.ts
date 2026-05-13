export interface ICourse {
  id: string;
  type: string;
  attributes: {
    title: string;
    sub_title: string | null;
    description: string | null;
    thumbnail: string | null;
    stats: {
      lectures: number;
      chapters: number;
      notes: number;
      exams: number;
      students: number;
    };
    category?: {
      data?: {
        id: string;
        type: string;
        attributes: {
          name: string;
        };
      };
    };
  };
}