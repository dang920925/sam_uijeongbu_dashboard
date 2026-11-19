// 갤러리·일정·연출진·팝업(FN-14~17) — develop §3.4.
import type { GalleryCategory, ScheduleType } from '@/src/types/codes';

export interface GalleryItemResponse {
  id: string;
  imageUrl: string;
  category: GalleryCategory;
  description: string | null;
  createdAt: string;
}
export interface GalleryCreateRequest {
  imageUrl: string;
  category: GalleryCategory;
  description?: string | null;
}

export interface ScheduleItemResponse {
  id: string;
  title: string;
  type: ScheduleType;
  startAt: string;
  endAt: string | null;
  location: string | null;
  description: string | null;
  classId: string | null;
  performanceId: string | null;
  createdAt: string;
}
export interface ScheduleUpsertRequest {
  title: string;
  type: ScheduleType;
  startAt: string;
  endAt?: string | null;
  location?: string | null;
  description?: string | null;
  classId?: string | null;
  performanceId?: string | null;
}
export interface ScheduleListQuery {
  type?: ScheduleType;
  year?: number;
  month?: number;
  page?: number;
  size?: number;
}

export interface AdminStaffItemResponse {
  id: string;
  name: string;
  role: string;
  profileImageUrl: string | null;
  bio: string | null;
  displayOrder: number;
  isVisible: boolean;
  createdAt: string;
}
export interface StaffUpsertRequest {
  name: string;
  role: string;
  profileImageUrl?: string | null;
  bio?: string | null;
  displayOrder?: number;
  isVisible?: boolean;
}

export interface AdminPopupItemResponse {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  overlapsActive: boolean;
  createdAt: string;
}
export interface PopupUpsertRequest {
  imageUrl: string;
  linkUrl?: string | null;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

/** 화면 모델 — 도메인별 이름. 필드 의미는 계약과 같다. */
export type GalleryItem = GalleryItemResponse;
export type Schedule = ScheduleItemResponse;
export type Staff = AdminStaffItemResponse;
export type Popup = AdminPopupItemResponse;
