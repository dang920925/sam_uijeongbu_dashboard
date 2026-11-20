// 갤러리·일정·연출진·팝업(FN-14~17) — develop §3.4.
// 정본: server src/admin/{galleries,staff,popups}/dto/*-response.dto.ts · src/domain/schedules/dto/schedule-item-response.dto.ts
import type {
  GalleryCategory,
  ScheduleStatus,
  ScheduleType,
} from '@/src/types/codes';

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
  /** 일정의 연결 공연 ?? 연결 반의 공연(서버 ScheduleItemResponseDto — B8) */
  performanceId: string | null;
  /** U29 — 취소 상태·사유·참관 받지 않음(취소일 때만 값) */
  status: ScheduleStatus;
  cancelReason: string | null;
  observationClosed: boolean | null;
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
  status?: ScheduleStatus;
  year?: number;
  month?: number;
  page?: number;
  size?: number;
}
/** U29 `POST /admin/schedules/{id}/cancel` */
export interface ScheduleCancelRequest {
  reason: string;
  observationClosed: boolean;
}
/** U29 `GET /admin/schedules/{id}/cancel-impact` — 그 날·그 공연 참관 신청(PENDING·APPROVED) */
export interface ScheduleCancelImpactResponse {
  observationApplications: {
    count: number;
    items: {
      id: string;
      applicantName: string;
      phone: string;
      status: 'PENDING' | 'APPROVED';
    }[];
  };
}
export type ScheduleCancelImpact = ScheduleCancelImpactResponse;

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
