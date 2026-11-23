// ----------------------------------------------------------------------
// 코드값(UPPER_SNAKE) ↔ 대시보드 라벨 — develop §3.1 코드값 표(라벨은 현행 대시보드 문구 S-code-20).
// 저장 값과 화면 문구를 분리한다(style-guide §1).
// ----------------------------------------------------------------------
import type {
  BookingShowState,
  CancelReason,
  ReservationStatus,
} from '@/src/types/booking';

export type PerformanceType = 'MUSICAL' | 'PLAY' | 'SEMINAR' | 'ETC';
export type PerformanceStatus = 'UPCOMING' | 'ONGOING' | 'ENDED';
export type ClassStatus = 'ACTIVE' | 'INACTIVE';
export type DayCode = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type MemberType = 'GENERAL' | 'ACTOR';
export type ApplicationType = 'WORK_OBSERVATION' | 'CONSULTATION';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ConsultationMethod = 'VISIT' | 'PHONE' | 'ONLINE';
export type PreferredTime =
  'WEEKDAY_DAY' | 'WEEKDAY_EVENING' | 'WEEKEND_DAY' | 'WEEKEND_EVENING';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type ScheduleType = 'PRACTICE' | 'SHOW' | 'EVENT' | 'ETC';
/** 일정 상태(U29 — develop §13) */
export type ScheduleStatus = 'ACTIVE' | 'CANCELLED';
/** 신청 진행 단계(U31 보강 — develop §15.5). JOINED 는 상담만 */
export type ApplicationProgress =
  'RECEIVED' | 'SCHEDULED' | 'COMPLETED' | 'JOINED' | 'DROPPED';
/** 신청 목록 정렬 기준(develop §15.5) */
export type ApplicationSort = 'createdAt' | 'progress' | 'contactedAt';
export type SortOrder = 'asc' | 'desc';
export type GalleryCategory =
  'PERFORMANCE' | 'PRACTICE' | 'EVENT' | 'GROUP' | 'ETC';
export type UploadPurpose =
  | 'PERFORMANCE_POSTER'
  | 'PERFORMANCE_DETAIL'
  | 'ACTOR_PROFILE'
  | 'STAFF_PROFILE'
  | 'GALLERY'
  | 'POPUP'
  /** (U48) 캐스트 사진 — 단체샷 · 팀샷 · 배역 개인샷(back-end §25.1) */
  | 'CAST_PHOTO';

export const PERFORMANCE_TYPE_LABEL: Record<PerformanceType, string> = {
  MUSICAL: '뮤지컬',
  PLAY: '연극',
  SEMINAR: '세미나',
  ETC: '기타',
};
export const PERFORMANCE_TYPES: PerformanceType[] = [
  'MUSICAL',
  'PLAY',
  'SEMINAR',
  'ETC',
];

/** 대시보드 표기 "예정/진행중/종료"(홈페이지 표기와 다름) */
export const PERFORMANCE_STATUS_LABEL: Record<PerformanceStatus, string> = {
  UPCOMING: '예정',
  ONGOING: '진행중',
  ENDED: '종료',
};
export const PERFORMANCE_STATUSES: PerformanceStatus[] = [
  'UPCOMING',
  'ONGOING',
  'ENDED',
];

export const CLASS_STATUS_LABEL: Record<ClassStatus, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
};

export const DAY_CODES: DayCode[] = [
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
  'SUN',
];
export const DAY_LABEL: Record<DayCode, string> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
};

export const MEMBER_TYPE_LABEL: Record<MemberType, string> = {
  GENERAL: '일반',
  ACTOR: '배우',
};

export const APPLICATION_TYPE_LABEL: Record<ApplicationType, string> = {
  WORK_OBSERVATION: '작품 참관',
  CONSULTATION: '방문 상담',
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '거절',
};

/** 대시보드 표기 "방문/전화/온라인" */
export const CONSULTATION_METHOD_LABEL: Record<ConsultationMethod, string> = {
  VISIT: '방문',
  PHONE: '전화',
  ONLINE: '온라인',
};

export const PREFERRED_TIME_LABEL: Record<PreferredTime, string> = {
  WEEKDAY_DAY: '평일 낮 (10~18시)',
  WEEKDAY_EVENING: '평일 저녁 (18~21시)',
  WEEKEND_DAY: '주말 낮',
  WEEKEND_EVENING: '주말 저녁',
};

export const GENDER_LABEL: Record<Gender, string> = {
  MALE: '남성',
  FEMALE: '여성',
  OTHER: '기타',
};

export const SCHEDULE_TYPE_LABEL: Record<ScheduleType, string> = {
  PRACTICE: '연습',
  SHOW: '공연',
  EVENT: '이벤트',
  ETC: '기타',
};
/** 참관 받지 않음 체크를 보이는 유형 — 연습·공연(사용자 확정 2026-11-20, develop §13 C-11) */
export const OBSERVATION_CLOSABLE_TYPES: ScheduleType[] = ['PRACTICE', 'SHOW'];

/** 진행 단계 순서 — 서버 정렬 순서와 같다(back-end §15) */
export const APPLICATION_PROGRESSES: ApplicationProgress[] = [
  'RECEIVED',
  'SCHEDULED',
  'COMPLETED',
  'JOINED',
  'DROPPED',
];
/** 유형별로 쓸 수 있는 진행 단계(참관에 JOINED 없음 — APP_012) */
export const APPLICATION_PROGRESSES_BY_TYPE: Record<
  ApplicationType,
  ApplicationProgress[]
> = {
  WORK_OBSERVATION: ['RECEIVED', 'SCHEDULED', 'COMPLETED', 'DROPPED'],
  CONSULTATION: ['RECEIVED', 'SCHEDULED', 'COMPLETED', 'JOINED', 'DROPPED'],
};
/** 진행 단계 화면 이름 — 유형별(design §10.1 제안) */
export const APPLICATION_PROGRESS_LABEL: Record<
  ApplicationType,
  Record<ApplicationProgress, string>
> = {
  WORK_OBSERVATION: {
    RECEIVED: '접수',
    SCHEDULED: '일정 확정',
    COMPLETED: '참관 완료',
    JOINED: '입단',
    DROPPED: '불참',
  },
  CONSULTATION: {
    RECEIVED: '접수',
    SCHEDULED: '상담 예정',
    COMPLETED: '상담 완료',
    JOINED: '입단',
    DROPPED: '보류',
  },
};

export const SCHEDULE_TYPES: ScheduleType[] = [
  'PRACTICE',
  'SHOW',
  'EVENT',
  'ETC',
];

export const GALLERY_CATEGORY_LABEL: Record<GalleryCategory, string> = {
  PERFORMANCE: '공연',
  PRACTICE: '연습',
  EVENT: '이벤트',
  GROUP: '단체사진',
  ETC: '기타',
};
export const GALLERY_CATEGORIES: GalleryCategory[] = [
  'PERFORMANCE',
  'PRACTICE',
  'EVENT',
  'GROUP',
  'ETC',
];

/** 업로드 허용 형식·크기 — develop FN-18 / §3.1 UploadPurpose */
export const UPLOAD_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export type UploadContentType = (typeof UPLOAD_CONTENT_TYPES)[number];
const MB = 1024 * 1024;
export const UPLOAD_MAX_BYTES: Record<UploadPurpose, number> = {
  PERFORMANCE_POSTER: 5 * MB,
  PERFORMANCE_DETAIL: 10 * MB,
  ACTOR_PROFILE: 5 * MB,
  STAFF_PROFILE: 5 * MB,
  GALLERY: 10 * MB,
  POPUP: 5 * MB,
  CAST_PHOTO: 10 * MB,
};

// ─── 예매(U24 R1) — 라벨은 design §6 SCR-D11·D12 "제안"(designer 시안에서 확정) ───

/** 회차 예매 상태 Label — design SCR-D11 "열림·오픈 전·매진·마감·준비 중"(제안) */
export const BOOKING_SHOW_STATE_LABEL: Record<BookingShowState, string> = {
  OPEN: '열림',
  NOT_YET: '오픈 전',
  SOLD_OUT: '매진',
  CLOSED: '마감',
  NOT_READY: '준비 중',
};

/** 예매 상태 — design §6 상태색 "입금 대기 · 예매 확정 · 취소", 필터 pill 은 "입금 대기·확정·취소"(제안) */
export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: '입금 대기',
  CONFIRMED: '확정',
  CANCELLED: '취소',
};
export const RESERVATION_STATUSES: ReservationStatus[] = [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
];

/** 취소 사유 — design SCR-D12 "예매자 요청·관리자·기한 지남"(제안) */
export const CANCEL_REASON_LABEL: Record<CancelReason, string> = {
  BOOKER_REQUEST: '예매자 요청',
  ADMIN: '관리자',
  DEADLINE_PASSED: '기한 지남',
};
export const CANCEL_REASONS: CancelReason[] = [
  'BOOKER_REQUEST',
  'ADMIN',
  'DEADLINE_PASSED',
];
