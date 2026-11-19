// ----------------------------------------------------------------------
// 반 요일·시간 충돌 사전 계산(FN-10) — 서버 409 CLS_002 와 같은 규칙으로 미리 경고한다.
// - 상대: 전 공연의 ACTIVE 반 중 마감일이 없거나 오늘(KST) 이후인 반(develop FN-10, 목 hasConflict 와 같음).
//   ⚠ 현행은 `new Date(deadline) < new Date()` 로 마감일 당일을 이미 지난 것으로 봤지만 서버 규칙(deadline >= 오늘)을 따른다.
// - 수정 중인 자기 반은 빼고 본다(excludeId).
// - 새 반이 비활성이면 충돌로 보지 않는다(서버도 ACTIVE 일 때만 409 — 자체 결정).
// - 요일 토글 비활성은 현행 로직 그대로: 미선택 요일 d 는 [...선택, d] 가 겹치면 비활성
//   (선택 자체가 이미 겹치면 나머지 요일이 전부 비활성 — designer W3 §8.3-2 현행 유지 기본안 — 자체 결정, front-end-dashboard.md §11.2).
// ----------------------------------------------------------------------
import { DAY_CODES, type ClassStatus, type DayCode } from '@/src/types/codes';
import type { PerformanceClass } from '@/src/types/performance-class';

export interface ClassSlot {
  daysOfWeek: DayCode[];
  startTime: string;
  endTime: string;
  status: ClassStatus;
}

export interface ConflictOptions {
  /** 오늘 KST 'YYYY-MM-DD' */
  today: string;
  /** 수정 중인 자기 반 id */
  excludeId: string | null;
}

export interface DayToggleState {
  day: DayCode;
  isSelected: boolean;
  isConflict: boolean;
}

/** 기존 반이 지금 시간을 차지하고 있는가(ACTIVE · 마감 전 · 시간 있음) */
export function isOccupyingClass(
  item: PerformanceClass,
  today: string
): boolean {
  return (
    item.status === 'ACTIVE' &&
    (item.deadline === null || item.deadline >= today) &&
    item.startTime !== null &&
    item.endTime !== null
  );
}

/** 후보 요일·시간이 차지 중인 다른 반과 겹치는가. "HH:mm" 은 0 채움이라 문자열 비교로 충분하다 */
export function hasClassConflict(
  slot: ClassSlot,
  classes: PerformanceClass[],
  { today, excludeId }: ConflictOptions
): boolean {
  if (slot.status !== 'ACTIVE') return false;
  if (slot.daysOfWeek.length === 0 || !slot.startTime || !slot.endTime)
    return false;
  return classes.some(
    (item) =>
      item.id !== excludeId &&
      isOccupyingClass(item, today) &&
      item.daysOfWeek.some((d) => slot.daysOfWeek.includes(d)) &&
      (item.startTime as string) < slot.endTime &&
      slot.startTime < (item.endTime as string)
  );
}

/** 월~일 토글 상태 — 선택 여부와 "고르면 겹치는" 미선택 요일 */
export function getDayToggleStates(
  slot: ClassSlot,
  classes: PerformanceClass[],
  options: ConflictOptions
): DayToggleState[] {
  return DAY_CODES.map((day) => {
    const isSelected = slot.daysOfWeek.includes(day);
    const isConflict =
      !isSelected &&
      hasClassConflict(
        { ...slot, daysOfWeek: [...slot.daysOfWeek, day] },
        classes,
        options
      );
    return { day, isSelected, isConflict };
  });
}

/** 요일 토글 — 선택/해제 후 월~일 순서로 정렬 */
export function toggleDay(days: DayCode[], day: DayCode): DayCode[] {
  const next = days.includes(day)
    ? days.filter((d) => d !== day)
    : [...days, day];
  return DAY_CODES.filter((d) => next.includes(d));
}
