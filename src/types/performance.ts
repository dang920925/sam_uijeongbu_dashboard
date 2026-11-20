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
  /** U35 좌석 지정 예매 스위치(back-end §16 — 관리 공연 목록·상세) */
  seatSelectionEnabled: boolean;
}

export interface AdminPerformanceResponse extends AdminPerformanceListItemResponse {
  description: string | null;
  detailImageUrls: string[];
  /** 캐스트·참여자 홈페이지 공개(R3 U33 — develop §17.3, 기본 false) */
  castPublic?: boolean;
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
  /** U35 — 응답에 없으면 false */
  seatSelectionEnabled: boolean;
}

/** 화면 모델 — 상세 */
export interface Performance extends PerformanceSummary {
  description: string | null;
  detailImageUrls: string[];
  /** 캐스트·참여자 홈페이지 공개(R3 — 옛 응답이면 false) */
  castPublic: boolean;
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
