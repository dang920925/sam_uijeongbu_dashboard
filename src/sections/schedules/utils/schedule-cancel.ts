// ----------------------------------------------------------------------
// U29 일정 취소 창(순수 함수) — 사유 검증·글자 수, 참관 체크 노출 유형, 참관 신청 경고 요약.
// 사유는 trim 1~50(develop §13 cancel 요청), 글자 수 표시는 입력 그대로(공백 포함 — designer §14.7 #6).
// ----------------------------------------------------------------------
import { MSG_D08 } from '@/src/shared/messages/d08';
import {
  OBSERVATION_CLOSABLE_TYPES,
  type ScheduleType,
} from '@/src/types/codes';
import type { ScheduleCancelImpact } from '@/src/types/content';

export const CANCEL_REASON_MAX = 50;
/** 경고 박스 이름 최대 개수(designer §14.3) */
export const CANCEL_IMPACT_NAMES_MAX = 5;

export function validateCancelReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length === 0 || trimmed.length > CANCEL_REASON_MAX)
    return MSG_D08.CANCEL_REASON_REQUIRED;
  return null;
}

export function cancelReasonCount(reason: string): string {
  return MSG_D08.CANCEL_REASON_COUNT(reason.length, CANCEL_REASON_MAX);
}

/** 참관 체크는 연습·공연에서만 보인다(사용자 확정 2026-11-20 · C-11) */
export function canCloseObservation(type: ScheduleType): boolean {
  return OBSERVATION_CLOSABLE_TYPES.includes(type);
}

export interface CancelImpactSummary {
  message: string;
  names: string[];
  /** "외 {n}건"(없으면 null) */
  restText: string | null;
}

/** 참관 신청이 없으면 null(경고 박스 없음) */
export function summarizeCancelImpact(
  impact: ScheduleCancelImpact | undefined
): CancelImpactSummary | null {
  const apps = impact?.observationApplications;
  if (!apps || apps.count === 0) return null;
  const names = apps.items
    .slice(0, CANCEL_IMPACT_NAMES_MAX)
    .map((item) => item.applicantName);
  const rest = apps.count - names.length;
  return {
    message: MSG_D08.CANCEL_IMPACT(apps.count),
    names,
    restText: rest > 0 ? MSG_D08.CANCEL_IMPACT_REST(rest) : null,
  };
}
