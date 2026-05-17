/** JSON:API entity attributes shared by center, faculty, and department nodes. */
export type AcademicEntityAttributes = {
  name?: string | null;
  parent_id?: number | string | null;
  image?: string | null;
};

export type University = {
  id: string;
  type?: string;
  attributes: {
    name: string;
    image?: string | null;
  };
};

export type Center = {
  id: string;
  type?: string;
  attributes?: AcademicEntityAttributes | null;
};

export type Department = {
  id: string;
  type?: string;
  attributes?: AcademicEntityAttributes | null;
};

export type FacultyParentRelation = {
  data?: Center | null;
};

/** Faculty list item used for University → Center → Faculty → Department selection. */
export type FacultyForSelection = {
  id: string;
  type?: string;
  attributes: {
    name?: string | null;
    /** Center id */
    parent_id?: number | string | null;
    parent?: FacultyParentRelation | null;
    childrens?: Department[] | null;
  };
};

export type AcademicSelectOption = {
  id: string;
  label: string;
};
