import { describe, expect, it } from 'vitest';

import {
  toInviterSummaryTable,
  toReservationKpis,
  toShowOptions,
  toShowSummaryTable,
  toTierSummaryTable,
} from '@/src/sections/reservations/utils/summary-view';
import type { ReservationSummaryBoardResponse } from '@/src/types/booking';

const SUMMARY: ReservationSummaryBoardResponse = {
  shows: [
    {
      showId: 's-1',
      showDate: '2099-12-12',
      startTime: '14:00',
      totalSeats: 50,
      pendingQty: 3,
      confirmedQty: 2,
      remainingSeats: 45,
      confirmedAmount: 20000,
      admittedCount: 1,
      byTier: [
        { tierId: 't-1', tierName: '일반', pendingQty: 3, confirmedQty: 0 },
        { tierId: null, tierName: '직접 입력', pendingQty: 0, confirmedQty: 2 },
      ],
    },
    {
      showId: 's-2',
      showDate: '2099-12-13',
      startTime: '13:00',
      totalSeats: 40,
      pendingQty: 0,
      confirmedQty: 1,
      remainingSeats: 39,
      confirmedAmount: 10000,
      admittedCount: 0,
      byTier: [
        { tierId: 't-2', tierName: '스태프', pendingQty: 0, confirmedQty: 1 },
      ],
    },
  ],
  tiers: [
    {
      tierId: 't-1',
      tierName: '일반',
      pendingQty: 3,
      confirmedQty: 0,
      confirmedAmount: 0,
    },
    {
      tierId: 't-2',
      tierName: '스태프',
      pendingQty: 0,
      confirmedQty: 1,
      confirmedAmount: 10000,
    },
    {
      tierId: null,
      tierName: '직접 입력',
      pendingQty: 0,
      confirmedQty: 2,
      confirmedAmount: 0,
    },
  ],
  inviters: [
    {
      kind: 'LEGACY',
      memberId: null,
      name: null,
      pendingQty: 3,
      confirmedQty: 1,
    },
    {
      kind: 'LEGACY',
      memberId: null,
      name: '직접 입력',
      pendingQty: 0,
      confirmedQty: 2,
    },
    {
      kind: 'MEMBER',
      memberId: 'm-1',
      name: '김단원',
      pendingQty: 0,
      confirmedQty: 0,
    },
  ],
  totals: {
    pendingCount: 2,
    pendingQty: 3,
    confirmedQty: 3,
    confirmedAmount: 30000,
    overdueCount: 1,
  },
};

describe('toReservationKpis', () => {
  it('KPI 4 를 만든다 — 남은 좌석은 회차 합', () => {
    const kpis = toReservationKpis(SUMMARY);
    expect(kpis.map((k) => k.value)).toEqual([
      '2건',
      '3매',
      '84석',
      '30,000원',
    ]);
    expect(kpis[0].description).toBe('3매 · 기한 지남 1건');
    expect(kpis[2].description).toBe('2회차 합계');
  });

  it('좌석 수 미정 회차가 있으면 남은 좌석은 - 이다', () => {
    const summary = {
      ...SUMMARY,
      shows: [{ ...SUMMARY.shows[0], remainingSeats: null }],
    };
    expect(toReservationKpis(summary)[2].value).toBe('-');
  });
});

describe('toShowOptions', () => {
  it('회차 pill·Dialog 선택지를 만든다', () => {
    expect(toShowOptions(SUMMARY)[0]).toEqual({
      id: 's-1',
      label: '12.12 14:00',
      longLabel: '12.12 (토) 14:00',
      remainingSeats: 45,
    });
    expect(toShowOptions(undefined)).toEqual([]);
  });
});

describe('toShowSummaryTable', () => {
  it('회차 줄 + 합계 줄을 만든다', () => {
    const table = toShowSummaryTable(SUMMARY);
    expect(table.rows).toHaveLength(3);
    expect(table.rows[2].cells).toEqual([
      '합계',
      '90석',
      '3매',
      '3매',
      '84석',
      '1명',
      '30,000원',
    ]);
  });
});

describe('toTierSummaryTable', () => {
  it('등급 열(직접 입력은 맨 끝)과 공연 합계·확정 금액 줄을 만든다(S51)', () => {
    const table = toTierSummaryTable(SUMMARY);
    expect(table.columns).toEqual(['회차', '일반', '스태프', '직접 입력']);
    expect(table.rows[0].cells).toEqual([
      '12.12 (토) 14:00',
      '확정 0 · 대기 3',
      '-',
      '확정 2 · 대기 0',
    ]);
    expect(table.rows[2].cells).toEqual([
      '공연 합계',
      '확정 0 · 대기 3',
      '확정 1 · 대기 0',
      '확정 2 · 대기 0',
    ]);
    expect(table.rows[3].cells).toEqual([
      '확정 금액',
      '0원',
      '10,000원',
      '0원',
    ]);
  });
});

describe('toInviterSummaryTable', () => {
  it('단원 → 직접 입력 → 초대 없음 순으로, 뒤 둘은 흐리게 둔다', () => {
    const table = toInviterSummaryTable(SUMMARY);
    expect(table.rows.map((r) => r.cells[0])).toEqual([
      '김단원',
      '직접 입력',
      '초대 없음',
    ]);
    expect(table.rows.map((r) => Boolean(r.isMuted))).toEqual([
      false,
      true,
      true,
    ]);
  });
});

describe('toInviterSummaryTable — U41', () => {
  it('배우 → 연출·스태프 관계자 → SAM 관계자 → 옛 예매 순이고 옛 예매만 흐리다(IP-7)', () => {
    const table = toInviterSummaryTable({
      ...SUMMARY,
      inviters: [
        {
          kind: 'LEGACY',
          memberId: null,
          name: null,
          pendingQty: 1,
          confirmedQty: 0,
        },
        {
          kind: 'SAM_RELATED',
          memberId: null,
          name: 'SAM 관계자',
          pendingQty: 2,
          confirmedQty: 0,
        },
        {
          kind: 'STAFF_RELATED',
          memberId: null,
          name: '연출·스태프 관계자',
          pendingQty: 0,
          confirmedQty: 3,
        },
        {
          kind: 'MEMBER',
          memberId: 'm1',
          name: '김단원',
          pendingQty: 2,
          confirmedQty: 0,
        },
      ],
    });
    expect(table.rows.map((r) => r.cells[0])).toEqual([
      '김단원',
      '연출·스태프 관계자',
      'SAM 관계자',
      '초대 없음',
    ]);
    expect(table.rows.map((r) => Boolean(r.isMuted))).toEqual([
      false,
      false,
      false,
      true,
    ]);
  });
});
