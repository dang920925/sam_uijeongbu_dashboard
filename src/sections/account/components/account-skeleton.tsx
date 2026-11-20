// ----------------------------------------------------------------------
// SCR-D15 로딩 — 카드 안 필드 자리(현재 아이디를 읽는 동안).
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';

import { MSG_COMMON } from '@/src/shared/messages/common';
import { LAYOUT } from '@/src/theme/layout-tokens';

const ROWS = [0, 1, 2, 3, 4];

export function AccountSkeleton() {
  return (
    <Card
      aria-busy='true'
      aria-label={MSG_COMMON.LOADING_ARIA}
      sx={{
        p: { xs: 4, md: 6 },
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {ROWS.map((row) => (
        <div key={row} className='flex flex-col gap-1'>
          <Skeleton variant='text' width='30%' />
          <Skeleton variant='rounded' height={LAYOUT.control} />
        </div>
      ))}
    </Card>
  );
}
