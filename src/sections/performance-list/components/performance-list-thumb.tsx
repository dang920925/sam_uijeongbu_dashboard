// ----------------------------------------------------------------------
// 포스터 썸네일 32×48(2:3) — 공연명 앞 식별 보조(designer W3 D03 `.d03-thumb`).
// 포스터가 있으면 장식 이미지(alt 빈 값 — 바로 옆에 공연명), 없으면 회색 자리 + 아이콘(aria-label "포스터 없음").
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Iconify } from '@/src/components/iconify';
import { Image } from '@/src/components/image';
import { MSG_D03 } from '@/src/shared/messages/d03';
import { LAYOUT, RADIUS } from '@/src/theme/layout-tokens';

interface PerformanceListThumbProps {
  posterImageUrl: string | null;
}

export function PerformanceListThumb({
  posterImageUrl,
}: PerformanceListThumbProps) {
  return (
    <Box
      role={posterImageUrl ? undefined : 'img'}
      aria-label={posterImageUrl ? undefined : MSG_D03.NO_POSTER}
      sx={{
        position: 'relative',
        width: LAYOUT.controlSm,
        aspectRatio: '2 / 3',
        flexShrink: 0,
        overflow: 'hidden',
        borderRadius: `${RADIUS.xs}px`,
        bgcolor: 'semantic.surface.placeholder',
        color: 'semantic.text.onPlaceholder',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {posterImageUrl ? (
        <Image src={posterImageUrl} alt='' sizes={`${LAYOUT.controlSm}px`} />
      ) : (
        <Iconify icon='solar:file-image-linear' />
      )}
    </Box>
  );
}
