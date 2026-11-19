// ----------------------------------------------------------------------
// 대시보드 요약 요청 함수(FN-19) — develop §3.4 `GET /admin/dashboard/summary`.
// 집계(공연 총수·진행·예정, 배우 수, 대기 신청 수, 일정 수, 최근 5)는 서버가 한다(B10 20건 상한·uuid 정렬 해소).
// ----------------------------------------------------------------------
import { fromDashboardSummaryResponse } from '@/src/api/dashboard-mapper';
import { endpoints } from '@/src/api/endpoints';
import { apiFetch } from '@/src/lib/api-client';
import type {
  DashboardSummary,
  DashboardSummaryResponse,
} from '@/src/types/dashboard';

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return fromDashboardSummaryResponse(
    await apiFetch<DashboardSummaryResponse>(endpoints.dashboard.summary)
  );
}
