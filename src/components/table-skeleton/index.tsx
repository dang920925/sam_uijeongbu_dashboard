// ----------------------------------------------------------------------
// TableSkeleton — 목록 로딩. md↑ 표 행 모양 / xs 카드 모양(현행 "로딩 중..." 대체, design §3 공통).
// ----------------------------------------------------------------------
import Skeleton from '@mui/material/Skeleton';

import { MSG_COMMON } from '@/src/shared/messages/common';

interface TableSkeletonProps {
  rows?: number;
  /** 'md' 면 md↑ 표, 'lg' 면 lg↑ 표 — DataTable cardBelow 와 같은 값 */
  cardBelow?: 'md' | 'lg';
}

export function TableSkeleton({
  rows = 5,
  cardBelow = 'md',
}: TableSkeletonProps) {
  const tableClass = cardBelow === 'lg' ? 'hidden lg:block' : 'hidden md:block';
  const cardClass = cardBelow === 'lg' ? 'lg:hidden' : 'md:hidden';
  const keys = Array.from({ length: rows }, (_, i) => i);
  return (
    <div aria-busy='true' aria-label={MSG_COMMON.LOADING_ARIA}>
      <div className={tableClass}>
        <div className='flex flex-col gap-3 p-4'>
          {keys.map((k) => (
            <Skeleton key={k} variant='rounded' height={40} />
          ))}
        </div>
      </div>
      <div className={cardClass}>
        <div className='flex flex-col gap-3 p-4'>
          {keys.map((k) => (
            <div key={k} className='flex flex-col gap-2'>
              <Skeleton variant='text' width='60%' />
              <Skeleton variant='text' width='40%' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
