import { describe, expect, it } from 'vitest';

import {
  APPLICATION_STATUS_TONE,
  PERFORMANCE_STATUS_TONE,
} from '@/src/utils/status-tone';

describe('status-tone', () => {
  it('공연 예정은 warning, 진행중은 success, 종료는 neutral 이다', () => {
    expect(PERFORMANCE_STATUS_TONE).toEqual({
      UPCOMING: 'warning',
      ONGOING: 'success',
      ENDED: 'neutral',
    });
  });

  it('신청 거절은 error(pastel) 로 표시한다', () => {
    expect(APPLICATION_STATUS_TONE.REJECTED).toBe('error');
  });
});
