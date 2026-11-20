import { describe, expect, it } from 'vitest';

import {
  applyAdmissionDelta,
  applyAdmissionResult,
  applyConfirmAndAdmit,
  fromAdmissionBoardResponse,
  fromAdmissionItemResponse,
  fromAdmissionShowResponse,
  revertConfirmAndAdmit,
  type AdmissionBoard,
} from '@/src/api/admission-mapper';
import type {
  AdminShowWithTitleResponse,
  AdmissionItemResponse,
} from '@/src/types/booking';

function itemRes(
  overrides: Partial<AdmissionItemResponse> = {}
): AdmissionItemResponse {
  return {
    id: 'r1',
    code: '1234',
    bookerName: '홍길동',
    phoneLast4: '5678',
    quantity: 4,
    items: [
      { tierName: '일반', quantity: 3, isCustom: false, visibility: 'PUBLIC' },
      {
        tierName: '스태프',
        quantity: 1,
        isCustom: false,
        visibility: 'LINK_ONLY',
      },
    ],
    source: 'ONLINE',
    admittedCount: 1,
    status: 'CONFIRMED',
    amount: 50000,
    deadlinePassed: false,
    memo: null,
    version: 1,
    ...overrides,
  };
}

const SUMMARY = {
  confirmedQty: 6,
  admittedCount: 1,
  notAdmittedQty: 5,
  pendingCount: 1,
  pendingQty: 2,
};

function board(): AdmissionBoard {
  return fromAdmissionBoardResponse({
    otherShowMatches: [],
    show: {
      id: 's1',
      performanceTitle: '작품',
      showDate: '2099-12-12',
      startTime: '14:00',
      venue: null,
    },
    summary: SUMMARY,
    items: [
      itemRes(),
      itemRes({
        id: 'r2',
        bookerName: '가나다',
        status: 'PENDING',
        quantity: 2,
        admittedCount: 0,
      }),
    ],
  });
}

describe('admission-mapper', () => {
  it('등급 줄의 할인(링크 전용)·직접 입력을 구분하고 관리자 등록·연락처 없음을 정규화한다', () => {
    // Act
    const item = fromAdmissionItemResponse(
      itemRes({
        phoneLast4: null,
        source: 'ADMIN',
        memo: '',
        items: [
          {
            tierName: '직접 입력',
            quantity: 2,
            isCustom: true,
            visibility: null,
          },
        ],
      })
    );
    const online = fromAdmissionItemResponse(itemRes());
    // Assert
    expect(item.phoneLast4).toBeNull();
    expect(item.isAdminSource).toBe(true);
    expect(item.memo).toBeNull();
    expect(item.lines[0]).toMatchObject({ isCustom: true, isDiscount: false });
    expect(online.lines.map((l) => l.isDiscount)).toEqual([false, true]);
  });

  it('명단을 남은 인원 있는 예매 먼저, 이름순으로 정렬한다', () => {
    // Act
    const result = fromAdmissionBoardResponse({
      show: board().show,
      summary: SUMMARY,
      otherShowMatches: [],
      items: [
        itemRes({ id: 'done', bookerName: '가', admittedCount: 4 }),
        itemRes({ id: 'b', bookerName: '하' }),
        itemRes({ id: 'a', bookerName: '나', status: 'PENDING' }),
      ],
    });
    // Assert
    expect(result.items.map((i) => i.id)).toEqual(['a', 'b', 'done']);
    expect(result.otherShowMatches).toEqual([]);
  });

  it('otherShowMatches 가 있으면 최대 5건만 쓴다', () => {
    // Arrange
    const match = {
      reservationId: 'x',
      code: '1234',
      showId: 's2',
      showDate: '2099-12-13',
      startTime: '17:00',
      bookerName: '홍',
      quantity: 2,
      status: 'CONFIRMED' as const,
    };
    // Act
    const result = fromAdmissionBoardResponse({
      show: board().show,
      summary: SUMMARY,
      items: [],
      otherShowMatches: Array.from({ length: 7 }, (_, i) => ({
        ...match,
        reservationId: `x${i}`,
      })),
    });
    // Assert
    expect(result.otherShowMatches).toHaveLength(5);
  });

  it('회차 응답의 공연 id 가 없으면 null 로 둔다', () => {
    // Arrange
    const res = {
      id: 's1',
      performanceTitle: '작품',
      showDate: '2099-12-12',
      startTime: '14:00:00',
      remainingSeats: 3,
    } as AdminShowWithTitleResponse;
    // Act
    const show = fromAdmissionShowResponse(res);
    // Assert
    expect(show.performanceId).toBeNull();
    expect(show.startTime).toBe('14:00');
  });

  it('낙관 표시로 입장 인원과 현황을 함께 바꾸고 행 자리는 그대로 둔다', () => {
    // Act
    const next = applyAdmissionDelta(board(), 'r1', 3);
    // Assert
    expect(next.items.map((i) => i.id)).toEqual(board().items.map((i) => i.id));
    expect(next.items.find((i) => i.id === 'r1')?.admittedCount).toBe(4);
    expect(next.summary.admittedCount).toBe(4);
    expect(next.summary.notAdmittedQty).toBe(2);
  });

  it('입금 확인 + 입장 낙관 표시와 되돌리기가 서로 상쇄된다', () => {
    // Arrange
    const before = board();
    const pending = before.items.find((i) => i.id === 'r2');
    // Act
    const optimistic = applyConfirmAndAdmit(before, 'r2', 1);
    const reverted = revertConfirmAndAdmit(
      optimistic,
      pending as NonNullable<typeof pending>,
      1
    );
    // Assert
    expect(optimistic.items.find((i) => i.id === 'r2')).toMatchObject({
      status: 'CONFIRMED',
      admittedCount: 1,
    });
    expect(optimistic.summary).toEqual({
      confirmedQty: 8,
      admittedCount: 2,
      notAdmittedQty: 6,
      pendingCount: 0,
      pendingQty: 0,
    });
    expect(reverted).toEqual(before);
  });

  it('서버 응답으로 행과 현황을 덮어쓴다', () => {
    // Act
    const next = applyAdmissionResult(board(), {
      item: fromAdmissionItemResponse(itemRes({ admittedCount: 2 })),
      summary: { ...SUMMARY, admittedCount: 9 },
    });
    // Assert
    expect(next.items.find((i) => i.id === 'r1')?.admittedCount).toBe(2);
    expect(next.summary.admittedCount).toBe(9);
  });
});
