// ----------------------------------------------------------------------
// 업로드 썸네일 — 64 정사각 / 2:3 세로(포스터) / 원형(사진). 이미지 없으면 회색 자리.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Iconify } from '@/src/components/iconify';
import { Image } from '@/src/components/image';
import { LAYOUT } from '@/src/theme/layout-tokens';

export type ThumbShape = 'square' | 'portrait' | 'circle';

interface UploadThumbProps {
  src: string | null;
  alt: string;
  shape?: ThumbShape;
  size?: number;
}

export function UploadThumb({
  src,
  alt,
  shape = 'square',
  size = LAYOUT.thumb,
}: UploadThumbProps) {
  const width = shape === 'portrait' ? Math.round((size * 2) / 3) : size;
  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height: size,
        flexShrink: 0,
        overflow: 'hidden',
        borderRadius: shape === 'circle' ? '50%' : 1.5,
        bgcolor: 'semantic.surface.placeholder',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'semantic.text.onPlaceholder',
      }}
    >
      {src ? (
        <Image src={src} alt={alt} sizes={`${size}px`} />
      ) : (
        <span role='img' aria-label={alt} className='inline-flex'>
          <Iconify icon='solar:file-image-linear' size='md' />
        </span>
      )}
    </Box>
  );
}
