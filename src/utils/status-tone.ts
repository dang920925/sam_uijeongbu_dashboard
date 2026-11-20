// ----------------------------------------------------------------------
// 코드값 → Label tone(designer.md §2.3 상태 배지 매핑, 현행 색 유지 — 충돌 C-10 U1 우선).
// 공연 상태는 요약(D02)·목록(D03)·상세(D04)·팝업 기간 상태(D10)가 같은 매핑을 쓴다.
// ----------------------------------------------------------------------
import type { LabelTone } from '@/src/theme/semantic';
import type { BookingShowState, ReservationStatus } from '@/src/types/booking';
import type {
  ApplicationStatus,
  ClassStatus,
  MemberType,
  PerformanceStatus,
  ScheduleType,
} from '@/src/types/codes';

export const PERFORMANCE_STATUS_TONE: Record<PerformanceStatus, LabelTone> = {
  ONGOING: 'success',
  UPCOMING: 'warning', // D02 현행 파랑 → D03·D04 와 같은 노랑으로 통일(designer §8.1-4, 사용자 확정 2026-11-19)
  ENDED: 'neutral',
};

export const APPLICATION_STATUS_TONE: Record<ApplicationStatus, LabelTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

export const CLASS_STATUS_TONE: Record<ClassStatus, LabelTone> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

export const MEMBER_TYPE_TONE: Record<MemberType, LabelTone> = {
  ACTOR: 'info',
  GENERAL: 'neutral',
};

/** 일정 타입 — 연습 neutral · 공연 info · 이벤트 warning · 기타 outline(Label variant) (designer W4 D08) */
export const SCHEDULE_TYPE_TONE: Record<ScheduleType, LabelTone> = {
  PRACTICE: 'neutral',
  SHOW: 'info',
  EVENT: 'warning',
  ETC: 'neutral',
};

/** 예매 상태(design §6 상태색) — 입금 대기 warning · 확정 success · 취소 neutral(outline 변형은 화면이 고른다) */
export const RESERVATION_STATUS_TONE: Record<ReservationStatus, LabelTone> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'neutral',
};

/** 회차 예매 상태 — 열림 success · 오픈 전 info · 매진·마감·준비 중 neutral(designer D11 시안) */
export const BOOKING_SHOW_STATE_TONE: Record<BookingShowState, LabelTone> = {
  OPEN: 'success',
  NOT_YET: 'info',
  SOLD_OUT: 'neutral',
  CLOSED: 'neutral',
  NOT_READY: 'warning',
};
