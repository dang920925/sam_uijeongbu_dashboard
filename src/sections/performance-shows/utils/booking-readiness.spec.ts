import { describe, expect, it } from 'vitest';

import {
  buildReadinessNotice,
  showOnlyMissingFields,
  toRowMissingText,
} from '@/src/sections/performance-shows/utils/booking-readiness';

describe('booking-readiness', () => {
  it('공연 설정 빈 칸 → 누구나 등급 → 회차 빈 칸 개수 순서로 한 줄 경고를 만든다', () => {
    // Arrange — 회차 missingFields 에는 공연 설정 필드·publicTier 도 섞여 온다(develop §11.4·§11.10)
    const policyMissing = [
      'refundPolicyText',
      'depositAccountNumber',
      'depositAccountHolder',
      'depositDeadlineHours',
    ];
    const shows = [
      ['bookingOpenAt', 'publicTier', ...policyMissing],
      ['bookingOpenAt', 'publicTier', ...policyMissing],
      ['bookingOpenAt', 'publicTier', ...policyMissing],
      ['publicTier', 'bookingOpenAt'],
    ];
    // Act
    const notice = buildReadinessNotice(policyMissing, shows, false);
    // Assert
    expect(notice).toEqual({
      tone: 'warning',
      message:
        '예매를 열려면 다음 항목을 채워주세요: 계좌번호, 예금주, 입금 기한, 취소·환불 규정, 누구나 고를 수 있는 가격 등급, 예매 오픈 시각(회차 4개)',
    });
  });

  it('모두 채워졌으면 info 문구, 회차가 없으면 알림이 없다', () => {
    expect(buildReadinessNotice([], [[], []], false)).toEqual({
      tone: 'info',
      message:
        '예매 조건이 모두 채워졌습니다. 오픈 시각이 되면 예매가 열립니다.',
    });
    expect(buildReadinessNotice(['depositBank'], [], false)).toBeNull();
  });

  it('누구나 등급이 없어도 사용 중 링크 전용 등급이 있으면 경고 대신 링크 전용 안내를 보인다', () => {
    expect(
      buildReadinessNotice([], [['publicTier'], ['publicTier']], true)
    ).toEqual({
      tone: 'info',
      message: '링크로 들어온 사람만 예매할 수 있습니다.',
    });
    // 다른 빈 칸이 있으면 경고(누구나 등급 항목은 빼고)
    expect(
      buildReadinessNotice([], [['publicTier', 'totalSeats']], true)?.message
    ).toBe('예매를 열려면 다음 항목을 채워주세요: 좌석 수(회차 1개)');
  });

  it('회차 행 빈 칸은 회차 필드만 짧은 이름으로, 모르는 필드는 이름 그대로 둔다', () => {
    expect(
      toRowMissingText(['bookingOpenAt', 'depositBank', 'publicTier'])
    ).toBe('빈 칸: 오픈 시각');
    expect(toRowMissingText(['depositBank', 'publicTier'])).toBeNull();
    expect(showOnlyMissingFields(['unknownField', 'totalSeats'])).toEqual([
      'totalSeats',
      'unknownField',
    ]);
  });
});

describe('U35 seatMap 빈 칸', () => {
  it('좌석 배치가 없는 회차는 "좌석 배치"로 적는다', () => {
    expect(toRowMissingText(['seatMap'])).toBe('빈 칸: 좌석 배치');
    expect(buildReadinessNotice([], [['seatMap'], []], false)?.message).toBe(
      '예매를 열려면 다음 항목을 채워주세요: 좌석 배치(회차 1개)'
    );
  });
});
