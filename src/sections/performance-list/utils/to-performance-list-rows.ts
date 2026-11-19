// ----------------------------------------------------------------------
// 공연 목록(SCR-D03) 행 가공(순수 함수, + spec) — 코드값 → 현행 라벨(Performances.tsx:35-52),
// 등록일은 실제 날짜 KST `YYYY.MM.DD`(B1 — 현행은 '-'), 노출 여부는 "노출"/"비노출"(D5).
// ----------------------------------------------------------------------
import { MSG_COMMON } from '@/src/shared/messages/common';
import type { LabelTone } from '@/src/theme/semantic';
import {
  PERFORMANCE_STATUS_LABEL,
  PERFORMANCE_TYPE_LABEL,
} from '@/src/types/codes';
import type { PerformanceSummary } from '@/src/types/performance';
import { formatKstDate } from '@/src/utils/kst-date-format';
import { PERFORMANCE_STATUS_TONE } from '@/src/utils/status-tone';

export interface PerformanceListRow {
  id: string;
  title: string;
  posterImageUrl: string | null;
  typeLabel: string;
  statusLabel: string;
  statusTone: LabelTone;
  isVisible: boolean;
  visibilityLabel: string;
  createdLabel: string;
}

export function toPerformanceListRows(
  items: PerformanceSummary[]
): PerformanceListRow[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    posterImageUrl: item.posterImageUrl,
    typeLabel: PERFORMANCE_TYPE_LABEL[item.type],
    statusLabel: PERFORMANCE_STATUS_LABEL[item.status],
    statusTone: PERFORMANCE_STATUS_TONE[item.status],
    isVisible: item.isVisible,
    visibilityLabel: item.isVisible ? MSG_COMMON.VISIBLE : MSG_COMMON.HIDDEN,
    createdLabel: formatKstDate(item.createdAt),
  }));
}
