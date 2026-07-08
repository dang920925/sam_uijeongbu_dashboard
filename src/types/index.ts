// =====================
// Enum Types
// =====================
export type PerformanceType = 'musical' | 'play' | 'seminar' | 'etc'
export type PerformanceStatus = 'upcoming' | 'ongoing' | 'ended'
export type ClassStatus = 'active' | 'inactive'
export type MemberType = 'general' | 'actor'
export type ApplicationStatus = 'pending' | 'approved' | 'rejected'
export type ScheduleType = 'practice' | 'show' | 'event' | 'etc'

// =====================
// Auth
// =====================
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
}

// =====================
// Performance
// =====================
export interface Performance {
  id: string
  title: string
  type: PerformanceType
  status: PerformanceStatus
  description?: string
  thumbnail?: string
  createdAt: string
  updatedAt: string
}

export interface CreatePerformanceDto {
  title: string
  type: PerformanceType
  status: PerformanceStatus
  description?: string
  thumbnail?: string
}

export interface UpdatePerformanceDto extends Partial<CreatePerformanceDto> {}

// =====================
// Class
// =====================
export interface Class {
  id: string
  name: string
  performanceId: string
  status: ClassStatus
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateClassDto {
  name: string
  performanceId: string
  status: ClassStatus
  description?: string
}

export interface UpdateClassDto extends Partial<CreateClassDto> {}

// =====================
// Member
// =====================
export interface Member {
  id: string
  name: string
  phone?: string
  email?: string
  type: MemberType
  createdAt: string
  updatedAt: string
}

export interface CreateMemberDto {
  name: string
  phone?: string
  email?: string
  type: MemberType
}

export interface UpdateMemberDto extends Partial<CreateMemberDto> {}

// =====================
// Actor Profile
// =====================
export interface ActorProfile {
  id: string
  memberId: string
  intro?: string
  snsUrl?: string
  profileImage?: string
  birthYear?: number
  height?: number
  weight?: number
  createdAt: string
  updatedAt: string
}

export interface UpsertActorProfileDto {
  intro?: string
  snsUrl?: string
  profileImage?: string
  birthYear?: number
  height?: number
  weight?: number
}

// =====================
// Application
// =====================
export type AppType = 'work_observation' | 'consultation'

export interface Application {
  id: string
  appType: AppType
  applicantName: string
  phone: string
  performanceId?: string
  performance?: { id: string; title: string }
  preferredDate?: string
  preferredTime?: string
  motivation?: string
  consultationMethod?: string
  question?: string
  age?: number
  gender?: string
  status: ApplicationStatus
  processedAt?: string
  createdAt: string
}

export interface UpdateApplicationStatusDto {
  status: ApplicationStatus
}

// =====================
// Gallery
// =====================
export interface Gallery {
  id: string
  imageUrl: string
  category?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateGalleryDto {
  imageUrl: string
  category?: string
  description?: string
}

// =====================
// Schedule
// =====================
export interface Schedule {
  id: string
  title: string
  type: ScheduleType
  startTime: string
  endTime?: string
  location?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateScheduleDto {
  title: string
  type: ScheduleType
  startTime: string
  endTime?: string
  location?: string
  description?: string
}

export interface UpdateScheduleDto extends Partial<CreateScheduleDto> {}

// =====================
// Upload
// =====================
export interface UploadResponse {
  url: string
}

// =====================
// Common
// =====================
export interface ApiError {
  message: string
  statusCode: number
}
