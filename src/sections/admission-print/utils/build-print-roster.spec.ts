import { describe, expect, it } from 'vitest';

import type { AdmissionItem } from '@/src/api/admission-mapper';
import {
  buildPrintRoster,
  toRosterSort,
} from '@/src/sections/admission-print/utils/build-print-roster';

function item(over: Partial<AdmissionItem>): AdmissionItem {
  return {
    id: 'r',
    code: '0000',
    bookerName: '가',
    phoneLast4: '1234',
    quantity: 2,
    lines: [
      { tierName: '일반', quantity: 2, isCustom: false, isDiscount: false },
    ],
    isAdminSource: false,
    admittedCount: 0,
    status: 'CONFIRMED',
    amount: 0,
    deadlinePassed: false,
    memo: null,
    version: 1,
    seats: [],
    inviter: null,
    appliedPrice: null,
    ...over,
  };
}

const SUMMARY = {
  confirmedQty: 5,
  admittedCount: 1,
  notAdmittedQty: 4,
  pendingCount: 1,
  pendingQty: 1,
};

describe('buildPrintRoster', () => {
  it('확정·입금 대기를 나누고 이름 가나다순으로 정렬하며 연락처 없으면 "-"', () => {
    // Arrange
    const items = [
      item({ id: 'c', code: '3000', bookerName: '하늘' }),
      item({ id: 'a', code: '1000', bookerName: '나무', phoneLast4: null }),
      item({ id: 'p', code: '2000', bookerName: '가람', status: 'PENDING' }),
    ];
    // Act
    const roster = buildPrintRoster({ items, summary: SUMMARY }, 'name');
    // Assert
    expect(roster.confirmed.map((r) => r.bookerName)).toEqual(['나무', '하늘']);
    expect(roster.confirmed[0].phoneLast4).toBe('-');
    expect(roster.pending.map((r) => r.code)).toEqual(['2000']);
    expect(roster.confirmedQty).toBe(5);
    expect(roster.pendingCount).toBe(1);
  });

  it('예매번호순을 고를 수 있고 등급 줄을 "일반 2 · 스태프 1" 로 적는다', () => {
    // Arrange
    const items = [
      item({ id: 'b', code: '2000', bookerName: '가' }),
      item({
        id: 'a',
        code: '1000',
        bookerName: '하',
        quantity: 3,
        lines: [
          { tierName: '일반', quantity: 2, isCustom: false, isDiscount: false },
          {
            tierName: '스태프',
            quantity: 1,
            isCustom: false,
            isDiscount: true,
          },
        ],
      }),
    ];
    // Act
    const roster = buildPrintRoster({ items, summary: SUMMARY }, 'code');
    // Assert
    expect(roster.confirmed.map((r) => r.code)).toEqual(['1000', '2000']);
    expect(roster.confirmed[0].tierText).toBe('일반 2 · 스태프 1');
    expect(roster.confirmed[0].quantity).toBe(3);
  });

  it('정렬 쿼리는 code 만 예매번호순, 나머지는 이름순', () => {
    expect(toRosterSort('code')).toBe('code');
    expect(toRosterSort(null)).toBe('name');
    expect(toRosterSort('x')).toBe('name');
  });
});

describe('buildPrintRoster — U35 좌석', () => {
  it('좌석 지정 공연이면 좌석 칸("B3·B4" · 없으면 "좌석 미정"), 아니면 칸 없음', () => {
    const board = {
      items: [
        item({ id: 'a', seats: [{ rowLabel: 'B', seatNumber: 3 }] }),
        item({ id: 'b', code: '0001' }),
      ],
      summary: SUMMARY,
    };
    const on = buildPrintRoster(board, 'name', true);
    expect(on.hasSeatColumn).toBe(true);
    expect(on.confirmed.map((r) => r.seatText)).toEqual(['B3', '좌석 미정']);
    expect(buildPrintRoster(board, 'name').hasSeatColumn).toBe(false);
    expect(buildPrintRoster(board, 'name').confirmed[1].seatText).toBeNull();
  });
});
