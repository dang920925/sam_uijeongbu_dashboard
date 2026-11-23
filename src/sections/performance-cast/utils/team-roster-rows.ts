// ----------------------------------------------------------------------
// (U45) 팀 구성 표 줄(순수 함수) — 캐스트 배우마다 이름·배역 글자 + 팀별 체크 칸. 진행 중인 칸은 바뀔 값을 미리 보인다.
// ----------------------------------------------------------------------
import type { TeamRoster } from '@/src/types/practice';

export interface TeamRosterCell {
  teamAccountId: string;
  label: string;
  checked: boolean;
}

export interface TeamRosterRow {
  memberId: string;
  name: string;
  roleText: string;
  cells: TeamRosterCell[];
}

export interface PendingTeamCell {
  teamAccountId: string;
  memberId: string;
  checked: boolean;
}

export const teamCellKey = (teamAccountId: string, memberId: string) =>
  `${teamAccountId}:${memberId}`;

export function toTeamRosterRows(
  roster: TeamRoster,
  pending: readonly PendingTeamCell[] = []
): TeamRosterRow[] {
  const assigned = new Set(
    roster.teams.flatMap((t) =>
      t.memberIds.map((memberId) => teamCellKey(t.teamAccountId, memberId))
    )
  );
  const override = new Map(
    pending.map((p) => [teamCellKey(p.teamAccountId, p.memberId), p.checked])
  );
  return roster.members.map((m) => ({
    memberId: m.memberId,
    name: m.name,
    roleText: m.roleNames.join(' · '),
    cells: roster.teams.map((t) => {
      const key = teamCellKey(t.teamAccountId, m.memberId);
      return {
        teamAccountId: t.teamAccountId,
        label: t.label,
        checked: override.get(key) ?? assigned.has(key),
      };
    }),
  }));
}

/** 팀 계정 id → 소속 배우 이름(배역 순) — '팀 계정' 탭 표시용 */
export function toTeamMemberNames(roster: TeamRoster): Map<string, string[]> {
  const nameOf = new Map(roster.members.map((m) => [m.memberId, m.name]));
  return new Map(
    roster.teams.map((t) => [
      t.teamAccountId,
      t.memberIds
        .map((id) => nameOf.get(id))
        .filter((name): name is string => name !== undefined),
    ])
  );
}
