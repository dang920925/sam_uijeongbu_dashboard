// ----------------------------------------------------------------------
// 팝업 이미지 썸네일 — 4:3, 폭 64(designer SCR-D10). 표 행 식별은 노출 기간 글자가 하므로 장식(alt="").
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Image } from '@/src/components/image';
import { LAYOUT, RADIUS } from '@/src/theme/layout-tokens';

interface PopupThumbProps {
  src: string;
}

export function PopupThumb({ src }: PopupThumbProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        width: LAYOUT.thumb,
        aspectRatio: '4 / 3',
        flexShrink: 0,
        overflow: 'hidden',
        borderRadius: `${RADIUS.sm}px`,
        bgcolor: 'semantic.surface.placeholder',
      }}
    >
      <Image src={src} alt='' sizes={`${LAYOUT.thumb}px`} />
    </Box>
  );
}
