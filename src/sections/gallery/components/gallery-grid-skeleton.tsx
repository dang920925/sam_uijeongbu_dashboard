// ----------------------------------------------------------------------
// 갤러리 로딩 — 그리드와 같은 열 구성의 정사각 스켈레톤 10개(designer SCR-D07 loading, 현행 "로딩 중..." 대체).
// ----------------------------------------------------------------------
import Skeleton from '@mui/material/Skeleton';

import { MSG_COMMON } from '@/src/shared/messages/common';
import { RADIUS } from '@/src/theme/layout-tokens';

const KEYS = Array.from({ length: 10 }, (_, i) => i);

export function GalleryGridSkeleton() {
  return (
    <div
      aria-busy='true'
      aria-label={MSG_COMMON.LOADING_ARIA}
      className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
    >
      {KEYS.map((k) => (
        <Skeleton
          key={k}
          variant='rounded'
          sx={{
            height: 'auto',
            aspectRatio: '1 / 1',
            borderRadius: `${RADIUS.md}px`,
          }}
        />
      ))}
    </div>
  );
}
