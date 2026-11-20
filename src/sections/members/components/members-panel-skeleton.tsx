// ----------------------------------------------------------------------
// 패널 로딩 — 원형 사진 + 칸 몇 줄 모양(현행 "로딩 중..." 대체).
// ----------------------------------------------------------------------
import Skeleton from '@mui/material/Skeleton';

import { MSG_COMMON } from '@/src/shared/messages/common';
import { LAYOUT } from '@/src/theme/layout-tokens';

const LINES = [0, 1, 2];

export function MembersPanelSkeleton() {
  return (
    <div
      aria-busy='true'
      aria-label={MSG_COMMON.LOADING_ARIA}
      className='flex flex-col items-center gap-4'
    >
      <Skeleton
        variant='circular'
        width={LAYOUT.avatarXl}
        height={LAYOUT.avatarXl}
      />
      {LINES.map((k) => (
        <Skeleton key={k} variant='rounded' width='100%' height={40} />
      ))}
    </div>
  );
}
