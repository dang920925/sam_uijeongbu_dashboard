// ----------------------------------------------------------------------
// 팝업 노출 기간 계산(계약 밖 표시값 — designer §3.4 §5 "화면에서 계산, 계약 변경 불필요").
// - 상태: 오늘(KST) < 시작일 → 예정, 종료일 < 오늘 → 종료, 그 사이(양끝 포함) → 진행중(FN-05 "startDate ≤ 오늘 ≤ endDate").
//   라벨·색은 공연 상태 코드값 맵 재사용(PERFORMANCE_STATUS_LABEL·TONE).
// - 겹침: 활성이고 기간이 다른 활성 팝업과 하루라도 겹치면 true(목록 overlapsActive 와 같은 규칙) — 다이얼로그가 입력 중 값으로 미리 계산.
// 날짜는 모두 'YYYY-MM-DD' 라 문자열 비교로 충분하다.
// ----------------------------------------------------------------------
import type { PerformanceStatus } from '@/src/types/codes';
import { formatCalendarDate } from '@/src/utils/kst-date-format';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function getPopupPeriodStatus(
  startDate: string,
  endDate: string,
  today: string
): PerformanceStatus {
  if (today < startDate) return 'UPCOMING';
  if (endDate < today) return 'ENDED';
  return 'ONGOING';
}

export function formatPopupPeriod(startDate: string, endDate: string): string {
  return `${formatCalendarDate(startDate)} ~ ${formatCalendarDate(endDate)}`;
}

export interface PopupPeriodCandidate {
  id: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export function overlapsActivePopups(
  candidate: PopupPeriodCandidate,
  popups: PopupPeriodCandidate[]
): boolean {
  if (!candidate.isActive) return false;
  if (!DATE.test(candidate.startDate) || !DATE.test(candidate.endDate))
    return false;
  if (candidate.endDate < candidate.startDate) return false;
  return popups.some(
    (p) =>
      p.id !== candidate.id &&
      p.isActive &&
      candidate.startDate <= p.endDate &&
      p.startDate <= candidate.endDate
  );
}
