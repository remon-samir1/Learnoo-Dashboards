export interface Root {
  data: Data
}

export interface Data {
  id: string
  type: string
  attributes: IStudent
}

export interface IStudent {
  student_id: number
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
  data: Data2
}

export interface Data2 {
  id: string
  type: string
  attributes: Attributes2
}

export interface Attributes2 {
  image: string
  name: string
  stats: Stats
  created_at: string
  updated_at: string
}

export interface Stats {
  courses: number
  students: number
}

export interface Faculty {
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
