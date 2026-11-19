import { describe, expect, it } from 'vitest';

import {
  EMPTY_PERFORMANCE_FORM,
  validatePerformanceForm,
} from '@/src/components/performance-form-dialog/validate-performance-form';

describe('validatePerformanceForm', () => {
  it('제목이 비면 현행 문구로 막는다', () => {
    expect(validatePerformanceForm(EMPTY_PERFORMANCE_FORM).title).toBe(
      '공연 제목을 입력해주세요'
    );
  });

  it('새 공연 기본값은 연극·예정·노출 켬이다', () => {
    expect(EMPTY_PERFORMANCE_FORM).toMatchObject({
      type: 'PLAY',
      status: 'UPCOMING',
      isVisible: true,
    });
  });
});
