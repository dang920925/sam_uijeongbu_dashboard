import { describe, expect, it } from 'vitest';

import {
  moveId,
  toActorCandidates,
  toCreditRows,
  toRoleRows,
} from '@/src/sections/performance-cast/utils/cast-rows';
import type { Member } from '@/src/types/member';

const ON = { castPublic: true, performanceVisible: true };
const member = (id: string, overrides: Partial<Member> = {}): Member => ({
  id,
  name: `fixture-${id}`,
  type: 'ACTOR',
  phone: null,
  isVisible: true,
  joinedAt: null,
  createdAt: '2026-11-20T00:00:00.000Z',
  profileImageUrl: null,
  actorProfileId: `ap-${id}`,
  // T-SEAT(U36) 필드 — v1.3.0 합치기
  inviterListed: true,
  ...overrides,
});

describe('toRoleRows', () => {
  it('"출연" 묶음 라벨 · ▲▼ 가능 여부 · 이유를 만든다', () => {
    const rows = toRoleRows(
      [
        {
          id: 'r1',
          name: null,
          description: null,
          sortOrder: 0,
          isRecruiting: false,
          publicNow: true,
          defaultCast: [],
        },
        {
          id: 'r2',
          name: '햄릿',
          description: '왕자',
          sortOrder: 1,
          isRecruiting: true,
          publicNow: false,
          defaultCast: [
            {
              actorProfileId: 'p',
              memberId: 'm',
              name: 'fixture-배우',
              isVisible: false,
              note: null,
            },
          ],
        },
      ],
      ON
    );

    expect(rows[0]).toMatchObject({
      label: '출연',
      isEnsemble: true,
      canMoveUp: false,
      canMoveDown: true,
      reason: null,
    });
    expect(rows[1]).toMatchObject({
      label: '햄릿',
      canMoveDown: false,
      reason: '공개 안 됨 — 비노출 배우 포함',
    });
  });
});

describe('toCreditRows', () => {
  it('연결 갈래 라벨과 사람 이름을 고른다', () => {
    const rows = toCreditRows(
      [
        {
          id: 'c1',
          title: '연출',
          staff: { id: 's', name: 'fixture-연출가', isVisible: true },
          member: null,
          displayName: 'fixture-연출가',
          sortOrder: 0,
          isVisible: true,
          publicNow: true,
        },
        {
          id: 'c2',
          title: '음악감독',
          staff: null,
          member: null,
          displayName: 'fixture-이름',
          sortOrder: 1,
          isVisible: false,
          publicNow: false,
        },
      ],
      ON
    );

    expect(rows.map((r) => [r.personName, r.personKind, r.reason])).toEqual([
      ['fixture-연출가', '연출진', null],
      ['fixture-이름', '이름만 입력', '공개 안 됨 — 참여자 비노출'],
    ]);
  });
});

describe('moveId', () => {
  it('이웃과 자리를 바꾸고 끝이면 null 이다', () => {
    expect(moveId(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(moveId(['a', 'b'], 'a', -1)).toBeNull();
    expect(moveId(['a'], 'x', 1)).toBeNull();
  });
});

describe('toActorCandidates', () => {
  it('배우 단원만 이름으로 거르고 기본 캐스트를 먼저, 프로필이 필요하면 없는 배우는 막는다', () => {
    const list = toActorCandidates(
      [
        member('a'),
        member('b', { actorProfileId: null }),
        member('g', { type: 'GENERAL' }),
        member('c'),
      ],
      { query: '', defaultMemberIds: ['c'], requireProfile: true }
    );

    expect(list.map((c) => [c.memberId, c.isDefault, c.isDisabled])).toEqual([
      ['c', true, false],
      ['a', false, false],
      ['b', false, true],
    ]);
    expect(
      toActorCandidates([member('a'), member('b')], {
        query: 'fixture-b',
        defaultMemberIds: [],
        requireProfile: false,
      }).map((c) => c.memberId)
    ).toEqual(['b']);
  });
});
