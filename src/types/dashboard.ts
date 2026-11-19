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
