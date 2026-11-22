// 요약(FN-19) — develop §3.4 `GET /admin/dashboard/summary`.
import type {
  ApplicationType,
  PerformanceStatus,
  PerformanceType,
} from '@/src/types/codes';

export interface DashboardSummaryResponse {
  performances: { total: number; ongoing: number; upcoming: number };
  actorCount: number;
  pendingApplicationCount: number;
  /** U31 보강 → U39 — 연락 전이고 끝나지 않은(JOINED·DROPPED 아님) 신청. '신청서 관리' 메뉴 배지(U40) */
  uncontactedPendingCount: number;
  /** U40 — 입금 대기 예매(기한 안 지남, 모든 공연 합계). 앱 아이콘·'예매 관리' 메뉴 배지 */
  pendingReservationCount: number;
  scheduleCount: number;
  recentPerformances: {
    id: string;
    title: string;
    type: PerformanceType;
    status: PerformanceStatus;
  }[];
  pendingApplications: {
    id: string;
    applicantName: string;
    phone: string;
    appType: ApplicationType;
    createdAt: string;
  }[];
}

export type DashboardSummary = DashboardSummaryResponse;
