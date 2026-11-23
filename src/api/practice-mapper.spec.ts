import { describe, expect, it } from 'vitest';

import {
  formatAttendees,
  fromAdminRoomReservationResponse,
  fromTeamAccountListResponse,
  fromTeamRosterResponse,
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
  it('사용 중 계정만 라벨 순으로 팀마다 한 줄 "A - 아이디: Dear-A, 비밀번호: xxxx" 형식이다', () => {
    expect(
      toTeamCopyAll([
        team({ id: 'b', label: 'B', username: 'Dear-B', password: 'yyyy' }),
        team({ id: 'c', label: 'C', username: 'Dear-C', isActive: false }),
        team({}),
      ])
    ).toBe(
      'A - 아이디: Dear-A, 비밀번호: xxxx\nB - 아이디: Dear-B, 비밀번호: yyyy'
    );
  });

  it('Z 다음 AA 순서, 비밀번호를 모르는 계정은 빼고, 없으면 빈 문자열이다(경계)', () => {
    expect(
      toTeamCopyAll([
        team({ label: 'AA', username: 'D-AA' }),
        team({ label: 'Z', username: 'D-Z' }),
        team({ label: 'B', username: 'D-B', password: null }),
      ])
    ).toBe(
      'Z - 아이디: D-Z, 비밀번호: xxxx\nAA - 아이디: D-AA, 비밀번호: xxxx'
    );
    expect(toTeamCopyAll([])).toBe('');
  });

  it('한 줄 복사도 같은 형식이다', () => {
    expect(toTeamCopyLine(team({}))).toBe('A - 아이디: Dear-A, 비밀번호: xxxx');
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
        attendees: [],
        attendeeCount: 0,
      }).startAt
    ).toEqual(new Date('2026-12-01T10:00:00.000Z'));
  });

  it('(U45) 관리 예약의 참석자는 이름 목록으로 바꾼다', () => {
    expect(
      fromAdminRoomReservationResponse({
        id: 'r',
        startAt: '2026-12-01T10:00:00.000Z',
        endAt: '2026-12-01T11:00:00.000Z',
        teamName: 'Dear-A',
        memo: null,
        performanceId: 'p',
        performanceTitle: 'Dear',
        attendees: [
          { memberId: 'm1', name: '김가' },
          { memberId: 'm2', name: '이나' },
        ],
        attendeeCount: 2,
      }).attendeeNames
    ).toEqual(['김가', '이나']);
  });
});

describe('fromTeamRosterResponse (U45)', () => {
  it('팀·배우를 복사해 담는다(원본 배열을 공유하지 않는다)', () => {
    const res = {
      teams: [
        {
          teamAccountId: 'ta',
          label: 'A',
          username: 'Dear-A',
          isActive: true,
          memberIds: ['m1'],
        },
      ],
      members: [{ memberId: 'm1', name: '김가', roleNames: ['디어'] }],
    };
    const roster = fromTeamRosterResponse(res);
    expect(roster).toEqual(res);
    expect(roster.teams[0].memberIds).not.toBe(res.teams[0].memberIds);
  });
});

describe('formatAttendees (U45)', () => {
  it('인원 수와 이름을 쉼표로 잇는다', () => {
    expect(formatAttendees(['김가', '이나'], '-')).toBe('2명 · 김가, 이나');
  });

  it('없으면 대체 문구(경계)', () => {
    expect(formatAttendees([], '체크 안 함')).toBe('체크 안 함');
  });
});
