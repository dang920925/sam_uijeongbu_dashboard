import { describe, expect, it } from 'vitest';

import {
  isValidTeamPrefix,
  toTeamRowDisplay,
  toTeamRows,
} from '@/src/sections/performance-teams/utils/team-row';
import type { TeamAccount } from '@/src/types/practice';

const TEAM: TeamAccount = {
  id: 'a',
  label: 'A',
  username: 'Dear-A',
  password: 'Kz8mPq4RtW2x',
  isActive: true,
  revokedAt: null,
};

describe('toTeamRowDisplay', () => {
  it('기본은 비밀번호를 가리고, 보기면 평문이다', () => {
    expect(toTeamRowDisplay(TEAM, false).passwordText).toBe('••••••••••••');
    expect(toTeamRowDisplay(TEAM, true).passwordText).toBe('Kz8mPq4RtW2x');
    expect(toTeamRowDisplay(TEAM, false)).toMatchObject({
      statusText: '사용 중',
      statusTone: 'success',
      canCopy: true,
    });
  });

  it('비활성·폐기·복호화 불가를 구분한다(경계)', () => {
    expect(
      toTeamRowDisplay({ ...TEAM, isActive: false }, false).statusText
    ).toBe('사용 안 함');
    expect(
      toTeamRowDisplay(
        { ...TEAM, isActive: false, revokedAt: '2026-12-14T00:00:00Z' },
        false
      ).statusText
    ).toBe('폐기됨');
    expect(toTeamRowDisplay({ ...TEAM, password: null }, true)).toMatchObject({
      passwordText: '재발급 필요',
      canCopy: false,
    });
  });
});

describe('toTeamRows · isValidTeamPrefix', () => {
  it('라벨 순으로 정렬하고 보기 상태를 id 로 고른다', () => {
    const rows = toTeamRows(
      [{ ...TEAM, id: 'b', label: 'B' }, TEAM],
      new Set(['b'])
    );
    expect(rows.map((r) => [r.label, r.isRevealed])).toEqual([
      ['A', false],
      ['B', true],
    ]);
  });

  it('접두어는 영문·숫자 1~20자', () => {
    expect(isValidTeamPrefix('Dear2026')).toBe(true);
    expect(isValidTeamPrefix('')).toBe(false);
    expect(isValidTeamPrefix('De-ar')).toBe(false);
    expect(isValidTeamPrefix('a'.repeat(21))).toBe(false);
  });
});

describe('소속 배우(U45)', () => {
  it('이름을 쉼표로 잇고, 없으면 미배정이다', () => {
    expect(toTeamRowDisplay(TEAM, false, ['김가', '이나']).membersText).toBe(
      '김가, 이나'
    );
    expect(toTeamRowDisplay(TEAM, false).membersText).toBe('미배정');
  });

  it('toTeamRows 는 팀 id 로 이름을 찾는다', () => {
    const rows = toTeamRows([TEAM], new Set(), new Map([['a', ['김가']]]));
    expect(rows[0].membersText).toBe('김가');
  });
});
