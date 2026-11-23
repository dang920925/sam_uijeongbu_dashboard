import { describe, expect, it } from 'vitest';

import {
  toAmountText,
  toDepositPreviewView,
  toDepositRow,
  toPartialText,
  toReceivedAmountMap,
  toSourceText,
} from '@/src/api/deposit-notification-mapper';
import type {
  DepositNotificationItem,
  DepositReservationSummary,
} from '@/src/types/deposit-notification';

const RESERVATION: DepositReservationSummary = {
  id: 'fixture-r2-rsv-1',
  code: '1234',
  performanceId: 'fixture-r2-perf',
  performanceTitle: 'fixture-r2-공연',
  depositorName: '홍길동1234',
  amount: 15000,
  receivedAmount: 10000,
  status: 'PENDING',
  version: 1,
};

function buildItem(
  overrides: Partial<DepositNotificationItem> = {}
): DepositNotificationItem {
  return {
    id: 'fixture-r2-dn-1',
    receivedAt: '2026-11-23T05:07:00.000Z',
    source: 'com.kakaobank.channel',
    appPackage: null,
    appName: null,
    title: '입금',
    text: '홍길동1234 10,000원 잔액 ***',
    parsedAmount: 10000,
    status: 'PARTIAL',
    reviewReason: null,
    resolvedAt: null,
    reservation: RESERVATION,
    ...overrides,
  };
}

describe('toDepositRow', () => {
  it('일부 입금 — 경고 라벨, KST 시각, 받은 금액 문구, 처리 가능', () => {
    expect(toDepositRow(buildItem())).toEqual({
      id: 'fixture-r2-dn-1',
      receivedText: '2026.11.23 14:07',
      appText: '카카오뱅크',
      messageText: '입금\n홍길동1234 10,000원 잔액 ***',
      amountText: '10,000원',
      status: 'PARTIAL',
      statusLabel: '일부 입금',
      statusTone: 'warning',
      reasonText: null,
      reservation: {
        id: 'fixture-r2-rsv-1',
        code: '1234',
        text: '1234 · 홍길동1234 · fixture-r2-공연',
        partialText: '받은 금액 10,000원 / 15,000원',
      },
      canResolve: true,
    });
  });

  it('확인 안 된 입금은 error 라벨·예매 없음, 확인 필요는 이유를 붙인다', () => {
    const unmatched = toDepositRow(
      buildItem({ status: 'UNMATCHED', reservation: null, title: null })
    );
    const review = toDepositRow(
      buildItem({ status: 'NEEDS_REVIEW', reviewReason: 'OVERPAID' })
    );

    expect([
      unmatched.statusTone,
      unmatched.reservation,
      unmatched.messageText,
    ]).toEqual(['error', null, '홍길동1234 10,000원 잔액 ***']);
    expect([review.statusLabel, review.reasonText]).toEqual([
      '확인 필요',
      '금액이 더 많음',
    ]);
  });

  it.each(['AUTO_CONFIRMED', 'MANUALLY_MATCHED', 'IGNORED'] as const)(
    '%s 는 더 처리할 수 없다',
    (status) => {
      expect(toDepositRow(buildItem({ status })).canResolve).toBe(false);
    }
  );
});

describe('toDepositRow — 출처 앱', () => {
  it('앱 이름이 있으면 그것, 없으면 패키지를 앱 이름으로', () => {
    expect(
      toDepositRow(buildItem({ appName: '카카오뱅크', source: null })).appText
    ).toBe('카카오뱅크');
    expect(
      toDepositRow(buildItem({ appPackage: 'com.kakao.talk', source: null }))
        .appText
    ).toBe('알림톡');
  });

  it('판정 안 함(다른 앱)은 neutral 라벨과 이유, 처리 불가', () => {
    const row = toDepositRow(
      buildItem({ status: 'IGNORED_SOURCE', reservation: null })
    );

    expect([
      row.statusLabel,
      row.statusTone,
      row.reasonText,
      row.canResolve,
    ]).toEqual([
      '판정 안 함',
      'neutral',
      '판정하지 않는 알림(입금 아님·허용 밖 앱)',
      false,
    ]);
  });
});

describe('toSourceText', () => {
  it('패키지 이름을 앱 이름으로 바꾸고 모르면 그대로', () => {
    expect(toSourceText('com.kakao.talk')).toBe('알림톡');
    expect(toSourceText('com.kakaopay.app')).toBe('카카오페이');
    expect(toSourceText('fixture-app')).toBe('fixture-app');
    expect(toSourceText(null)).toBeNull();
  });
});

describe('toPartialText', () => {
  it('입금 대기이고 0 < 받은 금액 < 금액일 때만', () => {
    expect(
      toPartialText({ status: 'PENDING', amount: 15000, receivedAmount: 0 })
    ).toBeNull();
    expect(
      toPartialText({ status: 'PENDING', amount: 15000, receivedAmount: 15000 })
    ).toBeNull();
    expect(
      toPartialText({
        status: 'CONFIRMED',
        amount: 15000,
        receivedAmount: 5000,
      })
    ).toBeNull();
    expect(
      toPartialText({ status: 'PENDING', amount: 15000, receivedAmount: 5000 })
    ).toBe('받은 금액 5,000원 / 15,000원');
  });
});

describe('toAmountText', () => {
  it('null 이면 금액 모름', () => {
    expect(toAmountText(null)).toBe('금액 모름');
  });
});

describe('toDepositPreviewView', () => {
  it('판정 결과를 표시 모델로 바꾼다', () => {
    expect(
      toDepositPreviewView({
        text: 'x',
        amount: null,
        amountCandidates: [],
        matchedBy: null,
        unmatchedHint: 'CODE_ONLY',
        status: 'UNMATCHED',
        reviewReason: null,
        autoConfirm: true,
        matches: [],
      })
    ).toEqual({
      amountText: '금액 모름',
      candidatesText: '없음',
      matchedByText: '못 찾음',
      statusLabel: '확인 안 된 입금',
      statusTone: 'error',
      reasonText: '입금자명 불일치(예매번호만 일치)',
      matches: [],
    });
  });

  it('맞는 예매와 후보 금액을 보인다', () => {
    const view = toDepositPreviewView({
      text: 'x',
      amount: 15000,
      amountCandidates: [15000, 2000],
      matchedBy: 'DEPOSITOR',
      unmatchedHint: null,
      status: 'NEEDS_REVIEW',
      reviewReason: 'MULTIPLE_MATCH',
      autoConfirm: true,
      matches: [RESERVATION, { ...RESERVATION, id: 'r2', code: '5678' }],
    });

    expect([
      view.candidatesText,
      view.matchedByText,
      view.reasonText,
      view.matches.length,
    ]).toEqual([
      '15,000원, 2,000원',
      '입금자명 일치',
      '맞는 예매가 여러 건',
      2,
    ]);
  });
});

describe('toReceivedAmountMap', () => {
  it('예매 id → 받은 금액', () => {
    expect(
      toReceivedAmountMap([{ reservationId: 'r1', receivedAmount: 100 }]).get(
        'r1'
      )
    ).toBe(100);
  });
});
