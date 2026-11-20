// ----------------------------------------------------------------------
// xs 카드(표 대신) — 썸네일 왼쪽, [공연명] + 메타(타입 · 등록일 · 비노출일 때만 "비노출"), 상태 배지, ›.
// (designer W3 D03 xs 카드 · `.card-list__item`)
// ----------------------------------------------------------------------
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { PerformanceListThumb } from '@/src/sections/performance-list/components/performance-list-thumb';
import type { PerformanceListRow } from '@/src/sections/performance-list/utils/to-performance-list-rows';

interface PerformanceListCardProps {
  row: PerformanceListRow;
}

export function PerformanceListCard({ row }: PerformanceListCardProps) {
  return (
    <div className='flex items-center gap-3'>
      <PerformanceListThumb posterImageUrl={row.posterImageUrl} />
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <Typo.Body.Semibold noWrap>{row.title}</Typo.Body.Semibold>
        <div className='flex flex-wrap gap-x-3'>
          <Typo.Caption.Regular color='text.secondary'>
            {row.typeLabel}
          </Typo.Caption.Regular>
          <Typo.Caption.Regular color='text.secondary'>
            {row.createdLabel}
          </Typo.Caption.Regular>
          {row.isVisible ? null : (
            <Typo.Caption.Regular color='text.secondary'>
              {row.visibilityLabel}
            </Typo.Caption.Regular>
          )}
        </div>
      </div>
      <Label tone={row.statusTone}>{row.statusLabel}</Label>
      <Iconify
        icon='solar:alt-arrow-right-linear'
        sx={{ color: 'text.secondary' }}
      />
    </div>
  );
}
