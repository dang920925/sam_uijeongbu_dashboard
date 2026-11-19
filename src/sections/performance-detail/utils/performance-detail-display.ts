// ----------------------------------------------------------------------
// SCR-D04 표시 모델 — 공연 정보 카드·반 표 행을 화면 문자열로 가공한다(순수 함수 + spec).
// 날짜: 등록일 datetime → KST 'YYYY.MM.DD', 마감일 date → 'YYYY.MM.DD'(없으면 '-').
// 시간: "HH:MM ~ HH:MM"(둘 중 하나라도 없으면 '-' — 현행 PerformanceDetail.tsx:256-258).
// 요일: 월~일 순서 라벨을 ", " 로 잇는다(현행은 저장 문자열 그대로 — 계약이 배열로 바뀌어 표시만 정함, 자체 결정).
// ----------------------------------------------------------------------
import { MSG_COMMON } from '@/src/shared/messages/common';
import { formatDetailImageCount } from '@/src/shared/messages/d04';
import type { LabelTone } from '@/src/theme/semantic';
import {
  CLASS_STATUS_LABEL,
  DAY_CODES,
  DAY_LABEL,
  PERFORMANCE_STATUS_LABEL,
  PERFORMANCE_TYPE_LABEL,
  type DayCode,
} from '@/src/types/codes';
import type { PerformanceClass } from '@/src/types/performance-class';
import type { Performance } from '@/src/types/performance';
import { formatCalendarDate, formatKstDate } from '@/src/utils/kst-date-format';
import {
  CLASS_STATUS_TONE,
  PERFORMANCE_STATUS_TONE,
} from '@/src/utils/status-tone';

export interface PerformanceInfoDisplay {
  title: string;
  posterImageUrl: string | null;
  typeLabel: string;
  statusLabel: string;
  statusTone: LabelTone;
  createdAtText: string;
  isVisible: boolean;
  visibleText: string;
  detailImageCountText: string;
  description: string | null;
}

export interface ClassRowDisplay {
  id: string;
  name: string;
  daysText: string;
  timeText: string;
  deadlineText: string;
  statusLabel: string;
  statusTone: LabelTone;
}

export function formatClassDays(days: DayCode[]): string {
  const ordered = DAY_CODES.filter((d) => days.includes(d));
  return ordered.length === 0
    ? MSG_COMMON.EMPTY_VALUE
    : ordered.map((d) => DAY_LABEL[d]).join(', ');
}

export function formatClassTime(
  startTime: string | null,
  endTime: string | null
): string {
  if (!startTime || !endTime) return MSG_COMMON.EMPTY_VALUE;
  return `${startTime.slice(0, 5)} ~ ${endTime.slice(0, 5)}`;
}

export function toPerformanceInfoDisplay(
  performance: Performance
): PerformanceInfoDisplay {
  const description = performance.description?.trim() ?? '';
  return {
    title: performance.title,
    posterImageUrl: performance.posterImageUrl,
    typeLabel: PERFORMANCE_TYPE_LABEL[performance.type],
    statusLabel: PERFORMANCE_STATUS_LABEL[performance.status],
    statusTone: PERFORMANCE_STATUS_TONE[performance.status],
    createdAtText: formatKstDate(performance.createdAt),
    isVisible: performance.isVisible,
    visibleText: performance.isVisible ? MSG_COMMON.VISIBLE : MSG_COMMON.HIDDEN,
    detailImageCountText: formatDetailImageCount(
      performance.detailImageUrls.length
    ),
    description: description === '' ? null : description,
  };
}

export function toClassRowDisplay(item: PerformanceClass): ClassRowDisplay {
  return {
    id: item.id,
    name: item.name,
    daysText: formatClassDays(item.daysOfWeek),
    timeText: formatClassTime(item.startTime, item.endTime),
    deadlineText: formatCalendarDate(item.deadline),
    statusLabel: CLASS_STATUS_LABEL[item.status],
    statusTone: CLASS_STATUS_TONE[item.status],
  };
}
