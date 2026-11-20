// ----------------------------------------------------------------------
// 배우 프로필 'SAM 출연작'·'참여 직함' 표시 모델(design §12.1) — 순수 함수.
// - 출연작 행: 작품명 · 비노출 표시 · 배역(출연 묶음은 "출연") · 메모 · 연도.
// - 작품 드롭다운: 관리 화면이라 비노출·종료 포함, 상태 라벨(비노출 · 종료).
// - 배역 드롭다운: 그 작품 배역들(이름 있는 것) — 비우면 "출연"(선택 사항). 배역이 하나도 없으면 "새 배역 추가" 입력.
// ----------------------------------------------------------------------
import { MSG_D05_SAM } from '@/src/shared/messages/d05-sam';
import type { AdminRole, MemberSamCredits } from '@/src/types/cast';
import type { PerformanceSummary } from '@/src/types/performance';

export interface SamCastRow {
  key: string;
  roleId: string;
  title: string;
  isHidden: boolean;
  roleLabel: string;
  note: string | null;
  year: number | null;
}

export interface SamCreditRow {
  id: string;
  title: string;
  performanceTitle: string;
  isVisible: boolean;
}

export interface PerformanceOption {
  value: string;
  label: string;
}

export function toSamCastRows(data: MemberSamCredits): SamCastRow[] {
  return data.casts.map((cast) => ({
    key: `${cast.performanceId}-${cast.roleId}`,
    roleId: cast.roleId,
    title: cast.performanceTitle,
    isHidden: !cast.performanceVisible,
    roleLabel: cast.roleName ?? MSG_D05_SAM.ENSEMBLE,
    note: cast.note,
    year: cast.year,
  }));
}

export function toSamCreditRows(data: MemberSamCredits): SamCreditRow[] {
  return data.credits.map((credit) => ({
    id: credit.creditId,
    title: credit.title,
    performanceTitle: credit.performanceTitle,
    isVisible: credit.isVisible,
  }));
}

export function toPerformanceOptions(
  performances: readonly PerformanceSummary[]
): PerformanceOption[] {
  return performances.map((p) => {
    const tags = [
      p.isVisible ? null : MSG_D05_SAM.HIDDEN_PERFORMANCE,
      p.status === 'ENDED' ? MSG_D05_SAM.ENDED : null,
    ].filter(Boolean);
    return {
      value: p.id,
      label: tags.length > 0 ? `${p.title} (${tags.join(' · ')})` : p.title,
    };
  });
}

/** 배역 드롭다운 — 이름 있는 배역만(출연 묶음은 "배역 없음(출연)" 선택지가 대신한다) */
export function toRoleOptions(
  roles: readonly AdminRole[]
): PerformanceOption[] {
  return roles
    .filter((role) => role.name !== null)
    .map((role) => ({ value: role.id, label: role.name as string }));
}
