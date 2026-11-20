import { describe, expect, it } from 'vitest';

import {
  fromAdminRoomReservationResponse,
  fromTeamAccountListResponse,
  toTeamCopyAll,
  toTeamCopyLine,
} from '@/src/api/practice-mapper';
import type { TeamAccount } from '@/src/types/practice';

function team(overrides: Partial<TeamAccount>): TeamAccount {
  return {
    id: 't',
    label: 'A',
    username: 'Dear-A',
    password: 'xxxx',
    isActive: true,
    revokedAt: null,
    ...overrides,
  };
}

describe('toTeamCopyAll (PR-8)', () => {
  it('사용 중 계정만 라벨 순으로 "A - 아이디: Dear-A, 비밀번호 xxxx / B - …" 형식이다', () => {
    expect(
      toTeamCopyAll([
        team({ id: 'b', label: 'B', username: 'Dear-B', password: 'yyyy' }),
        team({ id: 'c', label: 'C', username: 'Dear-C', isActive: false }),
        team({}),
      ])
    ).toBe(
      'A - 아이디: Dear-A, 비밀번호 xxxx / B - 아이디: Dear-B, 비밀번호 yyyy'
    );
  });

  it('Z 다음 AA 순서, 비밀번호를 모르는 계정은 빼고, 없으면 빈 문자열이다(경계)', () => {
    expect(
      toTeamCopyAll([
        team({ label: 'AA', username: 'D-AA' }),
        team({ label: 'Z', username: 'D-Z' }),
        team({ label: 'B', username: 'D-B', password: null }),
      ])
    ).toBe('Z - 아이디: D-Z, 비밀번호 xxxx / AA - 아이디: D-AA, 비밀번호 xxxx');
    expect(toTeamCopyAll([])).toBe('');
  });

  it('한 줄 복사도 같은 형식이다', () => {
    expect(toTeamCopyLine(team({}))).toBe('A - 아이디: Dear-A, 비밀번호 xxxx');
  });
});

describe('fromTeamAccountListResponse · fromAdminRoomReservationResponse', () => {
  it('목록·예약을 화면 모델로 옮긴다', () => {
    expect(
      fromTeamAccountListResponse({
        prefix: null,
        items: [
          {
            id: 't',
            label: 'A',
            username: 'Dear-A',
            password: null,
            isActive: false,
            revokedAt: '2026-12-14T00:00:00.000Z',
            createdAt: '2026-11-20T00:00:00.000Z',
          },
        ],
      })
    ).toEqual({
      prefix: null,
      items: [
        {
          id: 't',
          label: 'A',
          username: 'Dear-A',
          password: null,
          isActive: false,
          revokedAt: '2026-12-14T00:00:00.000Z',
        },
      ],
    });
    expect(
      fromAdminRoomReservationResponse({
        id: 'r',
        startAt: '2026-12-01T10:00:00.000Z',
        endAt: '2026-12-01T11:00:00.000Z',
        teamName: 'Dear-A',
        memo: null,
        performanceId: 'p',
        performanceTitle: 'Dear',
      }).startAt
    ).toEqual(new Date('2026-12-01T10:00:00.000Z'));
  });
});
