// 공연(FN-09) — 서버 계약 develop §3.4 "공연" + 화면 모델.
import type { PerformanceStatus, PerformanceType } from '@/src/types/codes';

export interface AdminPerformanceListItemResponse {
  id: string;
  title: string;
  type: PerformanceType;
  status: PerformanceStatus;
  isVisible: boolean;
  posterImageUrl: string | null;
  createdAt: string;
}

export interface AdminPerformanceResponse extends AdminPerformanceListItemResponse {
  description: string | null;
  detailImageUrls: string[];
  updatedAt: string;
}

export interface PerformanceUpsertRequest {
  title: string;
  type: PerformanceType;
  status: PerformanceStatus;
  description?: string | null;
  posterImageUrl?: string | null;
  detailImageUrls?: string[];
  isVisible?: boolean;
}

export interface PerformanceListQuery {
  status?: PerformanceStatus;
  type?: PerformanceType;
  page?: number;
  size?: number;
}

/** 화면 모델 — 목록 행 */
export interface PerformanceSummary {
  id: string;
  title: string;
  type: PerformanceType;
  status: PerformanceStatus;
  isVisible: boolean;
  posterImageUrl: string | null;
  createdAt: string;
}

/** 화면 모델 — 상세 */
export interface Performance extends PerformanceSummary {
  description: string | null;
  detailImageUrls: string[];
  updatedAt: string;
}

/** 화면 폼 입력 */
export interface PerformanceFormInput {
  title: string;
  type: PerformanceType;
  status: PerformanceStatus;
  description: string;
  posterImageUrl: string | null;
  detailImageUrls: string[];
  isVisible: boolean;
}
