// ----------------------------------------------------------------------
// SCR-D11 본문 로딩 — 알림 줄 · 예매 설정 카드(라벨+입력 4쌍) · 회차 카드 목록(designer 시안 loading).
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';

import { MSG_COMMON } from '@/src/shared/messages/common';
import { LAYOUT } from '@/src/theme/layout-tokens';

const FIELDS = [0, 1, 2, 3];
const ROWS = [0, 1, 2];

export function PerformanceShowsSkeleton() {
  return (
    <div
      aria-busy='true'
      aria-label={MSG_COMMON.LOADING_ARIA}
      className='flex flex-col gap-6'
    >
      <Skeleton variant='rounded' height={LAYOUT.touch} />
      <Card>
        <div className='flex flex-col gap-4 p-4 md:p-6'>
          <Skeleton variant='text' width='25%' />
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {FIELDS.map((k) => (
              <div key={k} className='flex flex-col gap-1'>
                <Skeleton variant='text' width='15%' />
                <Skeleton variant='rounded' height={LAYOUT.touch} />
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card>
        <div className='flex flex-col gap-4 p-4 md:p-6'>
          <Skeleton variant='text' width='25%' />
          {ROWS.map((k) => (
            <div key={k} className='flex items-center justify-between gap-3'>
              <div className='flex flex-1 flex-col gap-1'>
                <Skeleton variant='text' width='30%' />
                <Skeleton variant='text' width='60%' />
              </div>
              <Skeleton
                variant='rounded'
                width={LAYOUT.avatarMd}
                height={LAYOUT.iconLg}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
