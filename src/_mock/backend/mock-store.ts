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
import type { ClassItemResponse } from '@/src/types/performance-class';
import type { AdminPerformanceResponse } from '@/src/types/performance';

export type SoftDeleted<T> = T & { deletedAt: string | null };

export type MockApplication = Omit<ApplicationItemResponse, 'member'> & {
  memberId: string | null;
};
export type MockPopup = Omit<AdminPopupItemResponse, 'overlapsActive'>;

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
  uploads: Map<
    string,
    { contentType: string; bytes: ArrayBuffer | null; token: string }
  >;
  /** accessToken → 만료 시각 */
  sessions: Map<string, number>;
  loginFailures: number;
  lockedUntil: number;
  seq: number;
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
    uploads: new Map(),
    sessions: new Map(),
    loginFailures: 0,
    lockedUntil: 0,
    seq: 0,
  };
}

const globalForMock = globalThis as unknown as { __samMockStore?: MockStore };

export function getStore(): MockStore {
  globalForMock.__samMockStore ??= emptyStore();
  return globalForMock.__samMockStore;
}

/** 데이터만 비운다 — 로그인 세션은 남겨 E2E storageState 가 계속 유효하게 */
export function resetStoreData(): void {
  const current = getStore();
  globalForMock.__samMockStore = {
    ...emptyStore(),
    sessions: current.sessions,
  };
}
