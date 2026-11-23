'use client';

// ----------------------------------------------------------------------
// (U45) SCR-D14 '팀 구성' 카드 ViewModel — 캐스트 배우 × 팀 체크(한 칸씩 PUT·DELETE, 진행 중인 칸은 바뀔 값을 미리 보인다).
// 표 조회 실패는 카드 안 "다시 시도", 저장 실패는 스낵바. JSX 없음.
// ----------------------------------------------------------------------
import { useState } from 'react';

import { useTeamRoster, useToggleTeamMember } from '@/src/api/practice-queries';
import {
  type PendingTeamCell,
  teamCellKey,
  toTeamRosterRows,
} from '@/src/sections/performance-cast/utils/team-roster-rows';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export type TeamRosterSectionStatus = 'loading' | 'error' | 'ready';

export function useTeamRosterSection(
  performanceId: string,
  onError: (message: string) => void
) {
  const rosterQuery = useTeamRoster(performanceId);
  const toggle = useToggleTeamMember(performanceId);
  const [pending, setPending] = useState<PendingTeamCell[]>([]);

  const roster = rosterQuery.data ?? { teams: [], members: [] };
  const status: TeamRosterSectionStatus = rosterQuery.isPending
    ? 'loading'
    : rosterQuery.isError
      ? 'error'
      : 'ready';

  return {
    status,
    errorMessage: rosterQuery.isError
      ? toApiErrorMessage(rosterQuery.error)
      : null,
    onRetry: () => void rosterQuery.refetch(),
    teams: roster.teams.map((t) => ({
      teamAccountId: t.teamAccountId,
      label: t.label,
    })),
    rows: toTeamRosterRows(roster, pending),
    onToggle: (teamAccountId: string, memberId: string, checked: boolean) => {
      const cell = { teamAccountId, memberId, checked };
      const key = teamCellKey(teamAccountId, memberId);
      const without = (list: PendingTeamCell[]) =>
        list.filter((p) => teamCellKey(p.teamAccountId, p.memberId) !== key);
      setPending((list) => [...without(list), cell]);
      toggle.mutate(cell, {
        onError: (error) => onError(toApiErrorMessage(error)),
        onSettled: () => setPending(without),
      });
    },
  };
}

export type TeamRosterSection = ReturnType<typeof useTeamRosterSection>;
