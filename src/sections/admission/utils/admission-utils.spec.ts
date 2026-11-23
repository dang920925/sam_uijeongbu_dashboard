import { describe, expect, it } from 'vitest';

import type { AdmissionItem, AdmissionShow } from '@/src/api/admission-mapper';
import { ApiError } from '@/src/lib/api-client';
import { classifyAdmissionError } from '@/src/sections/admission/utils/admission-error';
import { toAdmissionRowModel } from '@/src/sections/admission/utils/admission-row';
import {
  filterAdmissionItems,
  toSearchCode,
  toServerQuery,
} from '@/src/sections/admission/utils/admission-search';
import {
  formatKstClock,
  formatShowWhen,
  pickShowId,
} from '@/src/sections/admission/utils/admission-show';

function item(overrides: Partial<AdmissionItem> = {}): AdmissionItem {
  return {
    id: 'r1',
    code: '1234',
    bookerName: '홍길동',
    phoneLast4: '5678',
    quantity: 3,
    lines: [],
    isAdminSource: false,
    admittedCount: 0,
    status: 'CONFIRMED',
    amount: 30000,
    deadlinePassed: false,
    memo: null,
    version: 1,
    seats: [],
    inviter: null,
    appliedPrice: null,
    ...overrides,
  };
}

function show(id: string, showDate: string, startTime: string): AdmissionShow {
  return {
    id,
    performanceId: null,
    performanceTitle: '작품',
    showDate,
    startTime,
    remainingSeats: null,
  };
}

describe('admission-search', () => {
  const items = [
    item(),
    item({ id: 'r2', bookerName: '김철수', code: '9999', phoneLast4: '1234' }),
    item({ id: 'r3', bookerName: '박', code: '5555', phoneLast4: null }),
  ];

  it('이름 일부로 거른다', () => {
    expect(filterAdmissionItems(items, ' 길동 ').map((i) => i.id)).toEqual([
      'r1',
    ]);
  });

  it('4자리 숫자는 예매번호 또는 연락처 끝 4자리가 같은 예매를 찾는다', () => {
    expect(filterAdmissionItems(items, '1234').map((i) => i.id)).toEqual([
      'r1',
      'r2',
    ]);
    expect(filterAdmissionItems(items, '#5555').map((i) => i.id)).toEqual([
      'r3',
    ]);
  });

  it('4자리 전 숫자는 앞자리로 거르고 서버에는 보내지 않는다', () => {
    expect(filterAdmissionItems(items, '99').map((i) => i.id)).toEqual(['r2']);
    expect(toServerQuery('99')).toBe('');
    expect(toServerQuery('1234')).toBe('1234');
    expect(toServerQuery(' 홍 ')).toBe('홍');
  });

  it('예매번호 형식일 때만 다른 회차 조회 번호를 준다', () => {
    expect(toSearchCode('1234')).toBe('1234');
    expect(toSearchCode('홍길동')).toBeNull();
  });
});

describe('admission-show', () => {
  const shows = [
    show('a', '2099-12-12', '14:00'),
    show('b', '2099-12-12', '18:00'),
  ];
  const now = Date.parse('2099-12-12T17:00:00+09:00');

  it('주소의 회차 → 기억한 회차 → 지금과 가장 가까운 회차 순으로 고른다', () => {
    expect(pickShowId(shows, { requested: 'a', stored: 'b', now })).toBe('a');
    expect(pickShowId(shows, { requested: 'zz', stored: 'a', now })).toBe('a');
    expect(pickShowId(shows, { requested: null, stored: null, now })).toBe('b');
    expect(pickShowId([], { requested: 'a', stored: null, now })).toBeNull();
  });

  it('회차·갱신 시각을 KST 로 적는다', () => {
    expect(formatShowWhen('2099-12-02', '09:30')).toBe('12/2 09:30');
    expect(formatKstClock(Date.parse('2099-12-12T05:07:00Z'))).toBe('14:07');
  });
});

describe('admission-row', () => {
  const state = { busyIds: [], flashId: null };

  it('남은 인원에 따라 확정·입장 완료·입금 대기를 고른다', () => {
    expect(toAdmissionRowModel(item(), state).kind).toBe('confirmed');
    expect(toAdmissionRowModel(item({ admittedCount: 3 }), state).kind).toBe(
      'done'
    );
    expect(toAdmissionRowModel(item({ status: 'PENDING' }), state).kind).toBe(
      'pending'
    );
  });

  it('남은 1명이면 전원 입장을 숨기고 입장 0 이면 −1 을 막는다', () => {
    const row = toAdmissionRowModel(item({ admittedCount: 2 }), state);
    const fresh = toAdmissionRowModel(item(), state);
    expect(row.showAll).toBe(false);
    expect(fresh.showAll).toBe(true);
    expect(fresh.isMinusDisabled).toBe(true);
  });

  it('연락처가 없으면 끝 4자리 칸을 빼고, 등급 줄이 없으면 매수 한 줄로 보인다', () => {
    const row = toAdmissionRowModel(item({ phoneLast4: null }), state);
    expect(row.phoneText).toBeNull();
    expect(row.lines).toEqual([
      { tierName: '매수', quantity: 3, isCustom: false, isDiscount: false },
    ]);
  });

  it('버튼 이름에 예매자 이름을 넣고 요청 중인 행을 잠근다', () => {
    const row = toAdmissionRowModel(item(), {
      busyIds: ['r1'],
      flashId: 'r1',
    });
    expect(row.plusAria).toBe('홍길동 1명 입장');
    expect(row.minusAria).toBe('홍길동 입장 1명 되돌리기');
    expect(row.isBusy).toBe(true);
    expect(row.isFlash).toBe(true);
    expect(row.amountText).toBe('30,000원');
  });
});

describe('admission-error', () => {
  it('409 는 충돌, 5xx·네트워크는 연결 끊김, 그 밖 4xx 는 기타로 나눈다', () => {
    expect(classifyAdmissionError(new ApiError(409, null))).toBe('conflict');
    expect(classifyAdmissionError(new ApiError(503, null))).toBe('offline');
    expect(classifyAdmissionError(new TypeError('fetch failed'))).toBe(
      'offline'
    );
    expect(classifyAdmissionError(new ApiError(400, null))).toBe('other');
  });
});

describe('toAdmissionRowModel — U35 좌석(SE-7)', () => {
  it('좌석이 있으면 "B3·B4", 좌석 지정인데 없으면 좌석 미정, 꺼졌으면 null', () => {
    const state = { busyIds: [], flashId: null };
    const seated = toAdmissionRowModel(
      item({
        seats: [
          { rowLabel: 'B', seatNumber: 3 },
          { rowLabel: 'B', seatNumber: 4 },
        ],
      }),
      { ...state, seatSelection: true }
    );
    expect(seated.seatText).toBe('B3·B4');
    expect(seated.isSeatUnassigned).toBe(false);
    const unassigned = toAdmissionRowModel(item(), {
      ...state,
      seatSelection: true,
    });
    expect(unassigned).toMatchObject({
      seatText: '좌석 미정',
      isSeatUnassigned: true,
    });
    expect(toAdmissionRowModel(item(), state).seatText).toBeNull();
  });
});
