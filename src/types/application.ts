// 신청서(FN-13, D6 승인과 등록 분리) — develop §3.4 "신청서".
import type {
  ApplicationProgress,
  ApplicationSort,
  ApplicationStatus,
  ApplicationType,
  ConsultationMethod,
  Gender,
  MemberType,
  PreferredTime,
  SortOrder,
} from '@/src/types/codes';
import type { MemberListItemResponse } from '@/src/types/member';

export interface ApplicationItemResponse {
  id: string;
  appType: ApplicationType;
  applicantName: string;
  phone: string;
  performance: { id: string; title: string } | null;
  preferredDate: string | null;
  preferredTime: PreferredTime | null;
  motivation: string | null;
  consultationMethod: ConsultationMethod | null;
  question: string | null;
  age: number | null;
  gender: Gender | null;
  status: ApplicationStatus;
  processedAt: string | null;
  createdAt: string;
  member: { id: string; name: string } | null;
  /** U31 — 관심·희망 작품(참관·상담 공통), 모르겠어요 true · 작품 선택 false · 미전송/옛 행 null */
  interestedPerformances: { id: string; title: string }[];
  interestUndecided: boolean | null;
  /** U31 보강 — 연락·진행 */
  contactedAt: string | null;
  contactNote: string | null;
  progress: ApplicationProgress;
  progressUpdatedAt: string | null;
  /** U29 — 참관 날짜·공연의 일정이 참관 막고 취소됐을 때 */
  scheduleCancellation: { scheduleId: string; reason: string } | null;
}

export interface ApplicationListQuery {
  appType?: ApplicationType;
  status?: ApplicationStatus;
  performanceId?: string;
  /** 쿼리 문자열 'true'|'false' 로 나간다(back-end §15) */
  contacted?: boolean;
  progress?: ApplicationProgress;
  sort?: ApplicationSort;
  order?: SortOrder;
  page?: number;
  size?: number;
}

export interface ApplicationActionResponse {
  application: ApplicationItemResponse;
}

export interface RegisterMemberFromApplicationRequest {
  name: string;
  phone?: string | null;
  type: MemberType;
}

export interface RegisterMemberFromApplicationResponse {
  application: ApplicationItemResponse;
  member: MemberListItemResponse;
}

/** U31 보강 `PATCH /admin/applications/{id}/contact` — note 생략이면 그대로, null·빈 값이면 지움 */
export interface ApplicationContactRequest {
  contacted: boolean;
  note?: string | null;
}
/** U31 보강 `PATCH /admin/applications/{id}/progress` */
export interface ApplicationProgressRequest {
  progress: ApplicationProgress;
}

export interface PendingCountResponse {
  count: number;
}

/** 화면 모델 */
export interface Application {
  id: string;
  appType: ApplicationType;
  applicantName: string;
  phone: string;
  performance: { id: string; title: string } | null;
  preferredDate: string | null;
  preferredTime: PreferredTime | null;
  motivation: string | null;
  consultationMethod: ConsultationMethod | null;
  question: string | null;
  age: number | null;
  gender: Gender | null;
  status: ApplicationStatus;
  processedAt: string | null;
  createdAt: string;
  member: { id: string; name: string } | null;
  /** U31 — 관심·희망 작품(참관·상담 공통), 모르겠어요 true · 작품 선택 false · 미전송/옛 행 null */
  interestedPerformances: { id: string; title: string }[];
  interestUndecided: boolean | null;
  /** U31 보강 — 연락·진행 */
  contactedAt: string | null;
  contactNote: string | null;
  progress: ApplicationProgress;
  progressUpdatedAt: string | null;
  /** U29 — 참관 날짜·공연의 일정이 참관 막고 취소됐을 때 */
  scheduleCancellation: { scheduleId: string; reason: string } | null;
}
