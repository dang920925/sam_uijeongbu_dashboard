// ----------------------------------------------------------------------
// 로딩(designer loading) — 카드 3개 스켈레톤. 회차·현황 자리는 각 자리에서 따로 비운다.
// ----------------------------------------------------------------------
import Skeleton from '@mui/material/Skeleton';

import { MSG_COMMON } from '@/src/shared/messages/common';
import { RADIUS } from '@/src/theme/layout-tokens';

const ROWS = [0, 1, 2];

export function AdmissionSkeleton() {
  return (
    <div
      role='status'
      aria-label={MSG_COMMON.LOADING_ARIA}
      aria-busy
      className='flex flex-col gap-4'
    >
      {ROWS.map((row) => (
        <Skeleton
          key={row}
          variant='rectangular'
          height={160}
          sx={{ borderRadius: `${RADIUS.md}px` }}
        />
      ))}
    </div>
  );
}
