import { describe, expect, it } from 'vitest';

import {
  canCloseObservation,
  cancelReasonCount,
  summarizeCancelImpact,
  validateCancelReason,
} from '@/src/sections/schedules/utils/schedule-cancel';
import type { ScheduleCancelImpact } from '@/src/types/content';

function impact(count: number): ScheduleCancelImpact {
  return {
    observationApplications: {
      count,
      items: Array.from({ length: count }, (_, i) => ({
        id: `a${i}`,
        applicantName: `fixture-u23-신청${i + 1}`,
        phone: '01000000000',
        status: 'PENDING' as const,
      })),
    },
  };
}

describe('schedule-cancel', () => {
  it('사유는 공백만이면 오류, 1~50자면 통과한다', () => {
    expect(validateCancelReason('   ')).toBe('사유를 입력해주세요');
    expect(validateCancelReason('공연 단체관람')).toBeNull();
    expect(validateCancelReason('가'.repeat(51))).toBe('사유를 입력해주세요');
  });

  it('글자 수는 "{n}/50" 이다', () => {
    expect(cancelReasonCount('공연 단체관람')).toBe('7/50');
  });

  it('참관 체크는 연습·공연에서만 보인다(C-11)', () => {
    expect(canCloseObservation('PRACTICE')).toBe(true);
    expect(canCloseObservation('SHOW')).toBe(true);
    expect(canCloseObservation('EVENT')).toBe(false);
    expect(canCloseObservation('ETC')).toBe(false);
  });

  it('참관 신청이 없으면 경고 없음, 7건이면 이름 5 + "외 2건"', () => {
    expect(summarizeCancelImpact(impact(0))).toBeNull();
    expect(summarizeCancelImpact(undefined)).toBeNull();
    const summary = summarizeCancelImpact(impact(7));
    expect(summary?.message).toBe(
      '이 날짜에 참관 신청 7건이 있습니다. 신청서 관리에서 연락해주세요.'
    );
    expect(summary?.names).toHaveLength(5);
    expect(summary?.restText).toBe('외 2건');
    expect(summarizeCancelImpact(impact(2))?.restText).toBeNull();
  });
});
