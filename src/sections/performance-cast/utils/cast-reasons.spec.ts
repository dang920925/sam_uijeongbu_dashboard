import { describe, expect, it } from 'vitest';

import {
  castReason,
  creditReason,
} from '@/src/sections/performance-cast/utils/cast-reasons';
import type { AdminCredit } from '@/src/types/cast';

const ON = { castPublic: true, performanceVisible: true };
const actor = (isVisible: boolean) => ({
  actorProfileId: 'p',
  memberId: 'm',
  name: 'fixture-배우',
  isVisible,
  note: null,
});
const credit = (overrides: Partial<AdminCredit> = {}): AdminCredit => ({
  id: 'c',
  title: '연출',
  staff: null,
  member: null,
  displayName: 'fixture-이름',
  sortOrder: 0,
  isVisible: true,
  publicNow: false,
  ...overrides,
});

describe('castReason', () => {
  it('공개 중이면 이유가 없다', () => {
    expect(castReason(true, '햄릿', [], ON)).toBeNull();
  });

  it('공개 스위치 → 작품 비노출 순서로 이유를 고른다', () => {
    expect(
      castReason(false, '햄릿', [], {
        castPublic: false,
        performanceVisible: false,
      })
    ).toBe('공개 안 됨 — 공개 스위치 꺼짐');
    expect(
      castReason(false, '햄릿', [], {
        castPublic: true,
        performanceVisible: false,
      })
    ).toBe('공개 안 됨 — 작품 비노출');
  });

  it('이름 있는 배역은 비노출 배우 포함, 출연 묶음은 노출 배우 없음이다', () => {
    expect(castReason(false, '햄릿', [actor(true), actor(false)], ON)).toBe(
      '공개 안 됨 — 비노출 배우 포함'
    );
    expect(castReason(false, null, [actor(false)], ON)).toBe(
      '공개 안 됨 — 노출 배우 없음'
    );
  });
});

describe('creditReason', () => {
  it('참여자 비노출 → 연결 대상 비노출 순서다', () => {
    expect(creditReason(credit({ isVisible: false }), ON)).toBe(
      '공개 안 됨 — 참여자 비노출'
    );
    expect(
      creditReason(
        credit({ staff: { id: 's', name: 'x', isVisible: false } }),
        ON
      )
    ).toBe('공개 안 됨 — 연출진 비노출');
    expect(
      creditReason(
        credit({ member: { id: 'm', name: 'x', isVisible: false } }),
        ON
      )
    ).toBe('공개 안 됨 — 배우 비노출');
  });

  it('공개 중이면 이유가 없다', () => {
    expect(creditReason(credit({ publicNow: true }), ON)).toBeNull();
  });
});
