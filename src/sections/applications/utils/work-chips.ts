// ----------------------------------------------------------------------
// 작품 칸 칩(U31 — design §10·§10.1, designer §18.3) — 순수 함수.
// - 참관: "참관 {작품}" 칩 + 관심 작품 칩 / 상담: 희망 작품 칩. "아직 모르겠어요"는 외곽선 칩(맨 뒤).
// - 한 줄 유지: 화면 폭별로 보이는 칩 수를 정하고 나머지는 "+n"(lg 2 · md 1 · xs 3 — 시안 프레임 기준).
// - 칩이 하나도 없으면(옛 신청) 화면은 '-'.
// ----------------------------------------------------------------------
import { MSG_D06 } from '@/src/shared/messages/d06';
import type { Application } from '@/src/types/application';

export type WorkChipKind = 'observation' | 'interest' | 'undecided';

export interface WorkChip {
  key: string;
  text: string;
  kind: WorkChipKind;
}

export interface WorkChipSplit {
  visible: WorkChip[];
  /** 숨긴 칩 수(0 이면 "+n" 없음) */
  overflow: number;
}

/** 폭별 최대 칩 수(시안 SCR-D06-U31B default lg·md·xs) */
export const WORK_CHIP_LIMIT = { lg: 2, md: 1, xs: 3 } as const;

export function toWorkChips(
  app: Pick<
    Application,
    'appType' | 'performance' | 'interestedPerformances' | 'interestUndecided'
  >
): WorkChip[] {
  const chips: WorkChip[] = [];
  if (app.appType === 'WORK_OBSERVATION' && app.performance)
    chips.push({
      key: `obs-${app.performance.id}`,
      text: MSG_D06.WORK_OBSERVATION(app.performance.title),
      kind: 'observation',
    });
  for (const p of app.interestedPerformances)
    chips.push({ key: `int-${p.id}`, text: p.title, kind: 'interest' });
  if (app.interestUndecided === true)
    chips.push({
      key: 'undecided',
      text: MSG_D06.WORK_UNDECIDED,
      kind: 'undecided',
    });
  return chips;
}

/** 최대 limit 개만 보이고 나머지 수를 센다. 딱 하나 넘칠 때도 "+1"(시안 xs "+1") */
export function splitWorkChips(
  chips: WorkChip[],
  limit: number
): WorkChipSplit {
  const max = Math.max(1, limit);
  if (chips.length <= max) return { visible: chips, overflow: 0 };
  return { visible: chips.slice(0, max), overflow: chips.length - max };
}
