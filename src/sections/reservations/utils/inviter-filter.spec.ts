import {
  toInviterFilterOptions,
  toInviterQuery,
} from '@/src/sections/reservations/utils/inviter-filter';

describe('inviter-filter (U41 §22.1)', () => {
  it('선택값을 목록 쿼리로 바꾼다', () => {
    expect(toInviterQuery('ALL')).toEqual({});
    expect(toInviterQuery('SAM_RELATED')).toEqual({
      inviterKind: 'SAM_RELATED',
    });
    expect(toInviterQuery('MEMBER:m1')).toEqual({
      inviterKind: 'MEMBER',
      inviterMemberId: 'm1',
    });
    expect(toInviterQuery('MEMBER:')).toEqual({});
  });

  it('배우 선택지는 집계의 배우 묶음만 가나다순이다', () => {
    expect(
      toInviterFilterOptions({
        inviters: [
          {
            kind: 'MEMBER',
            memberId: 'b',
            name: '하늘',
            pendingQty: 1,
            confirmedQty: 0,
          },
          {
            kind: 'SAM_RELATED',
            memberId: null,
            name: 'SAM 관계자',
            pendingQty: 1,
            confirmedQty: 0,
          },
          {
            kind: 'MEMBER',
            memberId: 'a',
            name: '가람',
            pendingQty: 0,
            confirmedQty: 2,
          },
          {
            kind: 'LEGACY',
            memberId: null,
            name: null,
            pendingQty: 1,
            confirmedQty: 0,
          },
        ],
      })
    ).toEqual([
      { value: 'MEMBER:a', label: '가람' },
      { value: 'MEMBER:b', label: '하늘' },
    ]);
  });
});
