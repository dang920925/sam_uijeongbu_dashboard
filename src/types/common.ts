// ----------------------------------------------------------------------
// API 공통 계약 타입 — develop §3.1(페이지네이션·오류 본문).
// ----------------------------------------------------------------------

/** 페이지 응답 봉투 — 요청 page(1부터)·size(기본 20, 최대 100) */
export interface Paginated<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

/** 비페이지 목록(상한 있는 목록) */
export interface ItemsResponse<T> {
  items: T[];
}

/** 오류 본문 `{ statusCode, status, message, code?, timestamp, path }` */
export interface ApiErrorResponse {
  statusCode: number;
  status: string;
  message: string;
  code?: string;
  timestamp: string;
  path: string;
}

export interface PageQuery {
  page?: number;
  size?: number;
}

/** 관리 목록 페이지 크기(develop §3.1 기본 20) */
export const ADMIN_PAGE_SIZE = 20;
/** 상한 목록(갤러리 그리드·연결 선택) — develop §3.4 "갤러리 그리드는 size=100" */
export const ADMIN_MAX_PAGE_SIZE = 100;
