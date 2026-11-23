import { describe, expect, it } from 'vitest';

import {
  toTeamMemberNames,
  toTeamRosterRows,
} from '@/src/sections/performance-cast/utils/team-roster-rows';
import type { TeamRoster } from '@/src/types/practice';

const ROSTER: TeamRoster = {
  teams: [
    {
      teamAccountId: 'ta',
      label: 'A',
      username: 'Dear-A',
      isActive: true,
      memberIds: ['m1', 'm3'],
    },
    {
      teamAccountId: 'tb',
      label: 'B',
      username: 'Dear-B',
      isActive: true,
      memberIds: ['m3'],
    },
  ],
  members: [
    { memberId: 'm1', name: '배우1', roleNames: ['디어', '출연'] },
    { memberId: 'm2', name: '배우2', roleNames: ['친구'] },
    { memberId: 'm3', name: '배우3', roleNames: ['출연'] },
  ],
};

describe('toTeamRosterRows', () => {
  it('배우마다 배역 글자와 팀별 체크 칸을 만든다(여러 팀 가능, 기본 미배정)', () => {
    const rows = toTeamRosterRows(ROSTER);
    expect(
      rows.map((r) => [r.name, r.roleText, r.cells.map((c) => c.checked)])
    ).toEqual([
      ['배우1', '디어 · 출연', [true, false]],
      ['배우2', '친구', [false, false]],
      ['배우3', '출연', [true, true]],
    ]);
  });

  it('진행 중인 칸은 바뀔 값을 먼저 보인다', () => {
    const rows = toTeamRosterRows(ROSTER, [
      { teamAccountId: 'tb', memberId: 'm2', checked: true },
      { teamAccountId: 'ta', memberId: 'm1', checked: false },
    ]);
    expect(rows[0].cells.map((c) => c.checked)).toEqual([false, false]);
    expect(rows[1].cells.map((c) => c.checked)).toEqual([false, true]);
  });

  it('팀이 없으면 칸이 없고, 배우가 없으면 빈 목록이다(경계)', () => {
    expect(toTeamRosterRows({ ...ROSTER, teams: [] })[0].cells).toEqual([]);
    expect(toTeamRosterRows({ ...ROSTER, members: [] })).toEqual([]);
  });
});

describe('toTeamMemberNames', () => {
  it('팀별 소속 배우 이름을 배역 순으로 준다', () => {
    const names = toTeamMemberNames(ROSTER);
    expect(names.get('ta')).toEqual(['배우1', '배우3']);
    expect(names.get('tb')).toEqual(['배우3']);
  });

  it('후보에 없는 id 는 건너뛴다(경계)', () => {
    const names = toTeamMemberNames({
      ...ROSTER,
      teams: [{ ...ROSTER.teams[0], memberIds: ['gone'] }],
    });
    expect(names.get('ta')).toEqual([]);
  });
});
