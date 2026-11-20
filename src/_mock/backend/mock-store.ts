// ----------------------------------------------------------------------
// 목 백엔드 메모리 저장소 — 서버(back-end 동시 진행)가 없을 때 develop §3.4 계약대로 응답하기 위한 것.
// - 시드 데이터 없음(develop §4 "개발용 목업 시드는 두지 않는다") — 빈 상태로 시작하고, E2E·캡처가 픽스처를 만든다.
// - dev 서버 HMR 에도 상태가 남도록 globalThis 에 둔다. `POST /api/backend/v1/__mock/reset` 으로 비운다(세션은 유지).
// ----------------------------------------------------------------------
import type { ApplicationItemResponse } from '@/src/types/application';
import type {
  AdminPopupItemResponse,
  AdminStaffItemResponse,
  GalleryItemResponse,
  ScheduleItemResponse,
} from '@/src/types/content';
import type {
  ActorProfileResponse,
  MemberListItemResponse,
} from '@/src/types/member';
import type {
  BookingPolicyUpsertRequest,
  CancelReason,
  InviterCategory,
  SeatKind,
  ConfirmedBy,
  PriceTierVisibility,
  ReservationLineResponse,
  ReservationSource,
  ReservationStatus,
  ShowStatus,
} from '@/src/types/booking';
import type { ClassItemResponse } from '@/src/types/performance-class';
import type { AdminPerformanceResponse } from '@/src/types/performance';

export type SoftDeleted<T> = T & { deletedAt: string | null };

/** scheduleCancellation 은 일정에서 계산한다(U29 — develop §13.2) */
export type MockApplication = Omit<
  ApplicationItemResponse,
  'member' | 'scheduleCancellation'
> & {
  memberId: string | null;
};
export type MockPopup = Omit<AdminPopupItemResponse, 'overlapsActive'>;

/** 회차 행(shows — develop §11.2 R1). 좌석·상태 같은 계산 값은 booking-model 이 만든다 */
export interface MockShow {
  id: string;
  performanceId: string;
  classId: string | null;
  showDate: string;
  startTime: string;
  endTime: string | null;
  venue: string | null;
  status: ShowStatus;
  bookingEnabled: boolean;
  bookingOpenAt: string | null;
  totalSeats: number | null;
  createdAt: string;
}

/** 가격 등급(price_tiers — develop §11.10) */
export interface MockPriceTier {
  id: string;
  performanceId: string;
  name: string;
  price: number;
  visibility: PriceTierVisibility;
  linkToken: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

/** 예매 행(reservations — develop §11.2 R1) */
export interface MockReservation {
  id: string;
  performanceId: string;
  showId: string;
  code: string;
  quantity: number;
  amount: number;
  items: ReservationLineResponse[];
  tierTokenUsed: boolean;
  amountOverridden: boolean;
  bookerName: string;
  bookerPhone: string | null;
  depositorName: string | null;
  inviterMemberId: string | null;
  inviterNote: string | null;
  /** U36 — 초대 구분(null = 기존·없음) */
  inviterCategory?: InviterCategory | null;
  /** U35 — 잡은 좌석 id(취소돼도 기록은 남고, 살아 있는 예매만 좌석을 막는다) */
  seatIds?: string[];
  status: ReservationStatus;
  source: ReservationSource;
  depositDueAt: string | null;
  confirmedAt: string | null;
  confirmedBy: ConfirmedBy | null;
  cancelledAt: string | null;
  cancelReason: CancelReason | null;
  memo: string | null;
  admittedCount: number;
  version: number;
  createdAt: string;
}

/** 좌석 배치 칸(U35 — show_seats). VOID 칸은 두지 않는다 */
export interface MockSeatCell {
  id: string;
  rowIndex: number;
  colIndex: number;
  kind: Exclude<SeatKind, 'VOID'>;
  rowLabel: string | null;
  seatNumber: number | null;
}

/** 회차 좌석 배치(show_seat_layouts + show_seats) */
export interface MockSeatLayout {
  rowCount: number;
  colCount: number;
  cells: MockSeatCell[];
}

/** 관리자 계정(U25) — null 이면 env MOCK_ADMIN_USERNAME/PASSWORD. sessionVersion 이 토큰 버전과 다르면 401 */
export interface MockAccount {
  username: string | null;
  password: string | null;
  sessionVersion: number;
}

export interface MockStore {
  performances: SoftDeleted<AdminPerformanceResponse>[];
  classes: ClassItemResponse[];
  members: SoftDeleted<MemberListItemResponse>[];
  actorProfiles: Map<string, ActorProfileResponse>;
  applications: MockApplication[];
  galleries: SoftDeleted<GalleryItemResponse>[];
  schedules: SoftDeleted<ScheduleItemResponse>[];
  staff: SoftDeleted<AdminStaffItemResponse>[];
  popups: SoftDeleted<MockPopup>[];
  shows: MockShow[];
  priceTiers: MockPriceTier[];
  bookingPolicies: Map<string, BookingPolicyUpsertRequest>;
  reservations: MockReservation[];
  /** U35 showId → 배치 */
  seatLayouts: Map<string, MockSeatLayout>;
  admissionLogs: {
    id: string;
    reservationId: string;
    delta: number;
    admittedAfter: number;
    createdAt: string;
  }[];
  /** memberId → 초대 코드 */
  inviteCodes: Map<string, string>;
  account: MockAccount;
  /** accessToken → 발급 당시 sessionVersion(U25 다른 기기 로그아웃 흉내) */
  sessionVersions: Map<string, number>;
  /** U27 — 홈페이지 재검증 흉내 수신 기록(`__mock/client/api/revalidate`) */
  revalidateCalls: { tags: string[]; paths: string[]; receivedAt: string }[];
  uploads: Map<
    string,
    { contentType: string; bytes: ArrayBuffer | null; token: string }
  >;
  /** accessToken → 만료 시각 */
  sessions: Map<string, number>;
  /** 오류 상태 E2E·캡처용 고장 주입 — 경로 정규식이 맞는 요청 count 번을 status 로 실패시킨다 */
  faults: {
    method: string;
    pattern: string;
    status: number;
    remaining: number;
  }[];
  loginFailures: number;
  lockedUntil: number;
  seq: number;
  /** U37 새 예매 푸시 — 목 계정은 하나라 계정 구분 없이 기기 목록 하나 */
  pushDevices: {
    id: string;
    endpoint: string;
    userAgent: string | null;
    createdAt: string;
    lastSuccessAt: string | null;
  }[];
  /** U37 — false 면 서버 VAPID 키 없음 흉내(공개키 null · 등록·시험 503 PUSH_001) */
  pushEnabled: boolean;
  /** U37 — 시험 알림 발송 기록(E2E 확인용) */
  pushTestCalls: number;
}

function emptyStore(): MockStore {
  return {
    performances: [],
    classes: [],
    members: [],
    actorProfiles: new Map(),
    applications: [],
    galleries: [],
    schedules: [],
    staff: [],
    popups: [],
    shows: [],
    priceTiers: [],
    bookingPolicies: new Map(),
    reservations: [],
    seatLayouts: new Map(),
    admissionLogs: [],
    inviteCodes: new Map(),
    account: { username: null, password: null, sessionVersion: 0 },
    sessionVersions: new Map(),
    revalidateCalls: [],
    uploads: new Map(),
    sessions: new Map(),
    faults: [],
    loginFailures: 0,
    lockedUntil: 0,
    seq: 0,
    pushDevices: [],
    pushEnabled: true,
    pushTestCalls: 0,
  };
}

const globalForMock = globalThis as unknown as { __samMockStore?: MockStore };

export function getStore(): MockStore {
  globalForMock.__samMockStore ??= emptyStore();
  return globalForMock.__samMockStore;
}

/**
 * 데이터만 비운다 — 로그인 세션은 남겨 E2E storageState 가 계속 유효하게.
 * 계정(U25)도 env 값·sessionVersion 0 으로 되돌린다 → 계정 변경 테스트가 끊은 기존 세션(버전 0)이 다시 유효해진다.
 */
export function resetStoreData(): void {
  const current = getStore();
  globalForMock.__samMockStore = {
    ...emptyStore(),
    sessions: current.sessions,
    sessionVersions: current.sessionVersions,
  };
}

/** 지금 계정의 아이디·비밀번호(변경 전이면 env) */
export function currentCredentials(): { username: string; password: string } {
  const { account } = getStore();
  return {
    username: account.username ?? process.env.MOCK_ADMIN_USERNAME ?? '',
    password: account.password ?? process.env.MOCK_ADMIN_PASSWORD ?? '',
  };
}
