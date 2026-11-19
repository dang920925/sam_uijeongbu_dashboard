// ----------------------------------------------------------------------
// SCR-D04 로딩 — 머리·공연 정보(포스터 + 2열)·반 목록 모양 스켈레톤(designer loading, 현행 "로딩 중..." 대체).
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';

import { MSG_COMMON } from '@/src/shared/messages/common';
import { LAYOUT } from '@/src/theme/layout-tokens';

const ROWS = [0, 1, 2];
const INFO_ITEMS = [0, 1, 2, 3];

export function PerformanceDetailSkeleton() {
  return (
    <div
      aria-busy='true'
      aria-label={MSG_COMMON.LOADING_ARIA}
      className='flex flex-col gap-6'
    >
      <div className='flex items-center gap-3'>
        <Skeleton
          variant='rounded'
          width={LAYOUT.control}
          height={LAYOUT.control}
        />
        <div className='flex flex-1 flex-col gap-1'>
          <Skeleton variant='text' width='40%' />
          <Skeleton variant='text' width='20%' />
        </div>
      </div>
      <Card>
        <div className='flex flex-col gap-6 p-4 sm:flex-row md:p-6'>
          <Skeleton
            variant='rounded'
            width={LAYOUT.avatarXl}
            height={(LAYOUT.avatarXl * 3) / 2}
          />
          <div className='grid flex-1 grid-cols-2 gap-4'>
            {INFO_ITEMS.map((k) => (
              <div key={k} className='flex flex-col gap-1'>
                <Skeleton variant='text' width='30%' />
                <Skeleton variant='text' width='60%' />
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card>
        <div className='flex flex-col gap-3 p-4 md:p-6'>
          {ROWS.map((k) => (
            <div key={k} className='flex flex-col gap-1'>
              <Skeleton variant='text' width='30%' />
              <Skeleton variant='text' width='60%' />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
