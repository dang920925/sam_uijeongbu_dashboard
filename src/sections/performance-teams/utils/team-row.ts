// ----------------------------------------------------------------------
// 팀 계정 표 한 줄 표시값(순수 함수) — 비밀번호 가림/보기, 상태 Label(사용 중·사용 안 함·폐기됨), 소속 배우(U45).
// ----------------------------------------------------------------------
import { compareTeamLabels } from '@/src/api/practice-mapper';
import { MSG_TEAMS } from '@/src/shared/messages/team-accounts';
import type { LabelTone } from '@/src/theme/semantic';
import type { TeamAccount } from '@/src/types/practice';

export interface TeamRowDisplay {
  id: string;
  label: string;
  username: string;
  passwordText: string;
  isRevealed: boolean;
  canCopy: boolean;
  isActive: boolean;
  statusText: string;
  statusTone: LabelTone;
  /** (U45) 소속 배우 이름(쉼표) · 없으면 "미배정" */
  membersText: string;
}

export function toTeamRowDisplay(
  team: TeamAccount,
  isRevealed: boolean,
  memberNames: readonly string[] = []
): TeamRowDisplay {
  const status: [string, LabelTone] = team.revokedAt
    ? [MSG_TEAMS.REVOKED, 'neutral']
    : team.isActive
      ? [MSG_TEAMS.ACTIVE, 'success']
      : [MSG_TEAMS.INACTIVE, 'warning'];
  return {
    id: team.id,
    label: team.label,
    username: team.username,
    passwordText:
      team.password === null
        ? MSG_TEAMS.PASSWORD_UNKNOWN
        : isRevealed
          ? team.password
          : MSG_TEAMS.PASSWORD_MASK,
    isRevealed,
    canCopy: team.password !== null,
    isActive: team.isActive,
    statusText: status[0],
    statusTone: status[1],
    membersText:
      memberNames.length > 0 ? memberNames.join(', ') : MSG_TEAMS.MEMBERS_NONE,
  };
}

/** 라벨 순 표시값 — memberNames: 팀 id → 소속 배우 이름(U45, 없으면 미배정) */
export function toTeamRows(
  teams: readonly TeamAccount[],
  revealedIds: ReadonlySet<string>,
  memberNames: ReadonlyMap<string, readonly string[]> = new Map()
): TeamRowDisplay[] {
  return [...teams]
    .sort((a, b) => compareTeamLabels(a.label, b.label))
    .map((t) =>
      toTeamRowDisplay(t, revealedIds.has(t.id), memberNames.get(t.id))
    );
}

/** 접두어 형식(서버와 같은 규칙) */
export function isValidTeamPrefix(value: string): boolean {
  return /^[A-Za-z0-9]{1,20}$/.test(value);
}
