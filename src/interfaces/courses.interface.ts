export interface Root {
  data: Data
}

export interface Data {
  id: string
  type: string
  attributes: ICourse
}

export interface ICourse {
  title: string
  sub_title: string
  description: string
  thumbnail: string
  objectives: string
  price: number
  max_views_per_student: number
  visibility: string
  approval: number
  status: number
  reason: string
  stats: Stats
  instructor: Instructor
  category: Category
  chapter_attachments: string[]
  chapter_discussions: string[]
  created_at: string
  updated_at: string
}

export interface Stats {
  lectures: number
  chapters: number
  notes: number
  exams: number
  students: number
}

export interface Instructor {
  data: Data2
}

export interface Data2 {
  id: string
  type: string
  attributes: Attributes2
}

export interface Attributes2 {
  student_id: string
  first_name: string
  last_name: string
  full_name: string
  university: University
  faculty: Faculty
  phone: string
  role: string
  status: string
  email: string
  email_verified_at: string
  joined: string
  created_at: string
  updated_at: string
  activity_stats: ActivityStats
  device_access: DeviceAccess
}

export interface University {
  data: Data3
}

export interface Data3 {
  id: string
  type: string
  attributes: Attributes3
}

export interface Attributes3 {
  image: string
  name: string
  stats: Stats2
  created_at: string
  updated_at: string
}

export interface Stats2 {
  courses: number
  students: number
}

export interface Faculty {
  data: Data4
}

export interface Data4 {
  id: string
  type: string
  attributes: Attributes4
}

export interface Attributes4 {
  image: string
  name: string
  stats: Stats3
  created_at: string
  updated_at: string
}

export interface Stats3 {
  courses: number
  students: number
}

export interface ActivityStats {
  notes_created: number
  downloads: number
  live_attendance: number
  community_posts: number
}

export interface DeviceAccess {
  device: string
  last_ip: string
}

export interface Category {
  data: Data5
}

export interface Data5 {
  id: string
  type: string
  attributes: Attributes5
}

export interface Attributes5 {
  image: string
  name: string
  stats: Stats4
  created_at: string
  updated_at: string
}

export interface Stats4 {
  courses: number
  students: number
}
