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
  AdmissionBoardResponse,
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
    seats: [],
    inviter: null,
    appliedPrice: null,
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

  it('otherShowMatches(서버 모양 — code 없음·performanceTitle 있음)를 최대 5건, 시각 HH:mm 으로 쓴다', () => {
    // Arrange — 실서버 AdmissionOtherShowMatchItemDto 응답(integration 2026-11-20 실측)
    const match = {
      reservationId: 'x',
      showId: 's2',
      performanceTitle: '다른 작품',
      showDate: '2099-12-13',
      startTime: '17:00',
      bookerName: '홍',
      quantity: 2,
      status: 'CONFIRMED' as const,
    };
    const res = {
      show: board().show,
      summary: SUMMARY,
      items: [],
      otherShowMatches: Array.from({ length: 7 }, (_, i) => ({
        ...match,
        reservationId: `x${i}`,
      })),
    } satisfies AdmissionBoardResponse;
    // Act
    const result = fromAdmissionBoardResponse(res);
    // Assert
    expect(result.otherShowMatches).toHaveLength(5);
    expect(result.otherShowMatches[0]).toEqual({
      ...match,
      reservationId: 'x0',
    });
  });

  it('회차 목록 항목(서버 AdminUpcomingShowItemResponseDto)에서 공연 id·제목·시각을 읽는다', () => {
    // Arrange — 실서버 GET /admin/shows?from= 항목
    const res: AdminShowWithTitleResponse = {
      id: 's1',
      classId: null,
      showDate: '2099-12-12',
      startTime: '19:30',
      endTime: null,
      venue: '소극장',
      status: 'UPCOMING',
      bookingEnabled: true,
      bookingOpenAt: '2099-11-01T01:00:00.000Z',
      totalSeats: 50,
      pendingQty: 4,
      confirmedQty: 3,
      remainingSeats: 43,
      admittedCount: 0,
      state: 'OPEN',
      missingFields: [],
      performanceId: 'p1',
      performanceTitle: '작품',
    };
    // Act
    const show = fromAdmissionShowResponse(res);
    // Assert
    expect(show).toEqual({
      id: 's1',
      performanceId: 'p1',
      performanceTitle: '작품',
      showDate: '2099-12-12',
      startTime: '19:30',
      remainingSeats: 43,
    });
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
