// ----------------------------------------------------------------------
// 입장 처리 실패 분류 — 409(RSV_010·007·008) = 충돌(정본 스낵바 + 즉시 재조회, 지휘자 결정 2026-11-20),
// 네트워크·5xx(BFF 503 포함) = 연결 끊김 배너, 그 밖 4xx = 서버 문구 스낵바.
// ----------------------------------------------------------------------
import { ApiError } from '@/src/lib/api-client';

export type AdmissionErrorKind = 'conflict' | 'offline' | 'other';

export function classifyAdmissionError(error: unknown): AdmissionErrorKind {
  if (!(error instanceof ApiError)) return 'offline';
  if (error.status === 409) return 'conflict';
  if (error.status >= 500) return 'offline';
  return 'other';
}
