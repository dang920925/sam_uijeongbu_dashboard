// ----------------------------------------------------------------------
// (U48) 사진 틀 — 비율 고정(단체·팀샷 16:9, 배역 3:4) + 사진(가운데 잘라 채움) + 순서 칩 + 올리는 중 덮개(진행 막대).
// 사진이 없으면 children(점선 올리기 버튼 등)을 그대로 채운다. props 만으로 렌더.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import type { ReactNode } from 'react';

import { Image } from '@/src/components/image';
import { Typo } from '@/src/components/typo';
import type { PhotoUploadView } from '@/src/sections/performance-cast/utils/cast-photo-rows';
import { MSG_D14 } from '@/src/shared/messages/d14';
import { RADIUS } from '@/src/theme/layout-tokens';

interface CastPhotoFrameProps {
  ratio: '16 / 9' | '3 / 4';
  imageUrl: string | null;
  alt: string;
  upload: PhotoUploadView | null;
  badge?: string;
  sizes?: string;
  children?: ReactNode;
}

export function CastPhotoFrame({
  ratio,
  imageUrl,
  alt,
  upload,
  badge,
  sizes = '320px',
  children,
}: CastPhotoFrameProps) {
  const isBusy = upload !== null && upload.phase !== 'error';
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: ratio,
        overflow: 'hidden',
        borderRadius: `${RADIUS.sm}px`,
        bgcolor: imageUrl ? 'semantic.surface.muted' : 'transparent',
      }}
    >
      {imageUrl ? <Image src={imageUrl} alt={alt} sizes={sizes} /> : children}
      {badge ? (
        <Box
          className='absolute left-2 top-2 px-2'
          sx={{
            borderRadius: `${RADIUS.pill}px`,
            bgcolor: 'semantic.scrim.image',
            color: 'semantic.text.onImage',
          }}
        >
          <Typo.Caption.Semibold color='inherit'>{badge}</Typo.Caption.Semibold>
        </Box>
      ) : null}
      {isBusy ? (
        <Box
          role='status'
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            p: 1,
            bgcolor: 'semantic.scrim.image',
            color: 'semantic.text.onImage',
          }}
        >
          <Typo.Caption.Medium color='inherit'>
            {upload.phase === 'optimizing'
              ? MSG_D14.PHOTO_OPTIMIZING
              : MSG_D14.PHOTO_UPLOADING}
          </Typo.Caption.Medium>
          <LinearProgress
            sx={{ width: '80%' }}
            aria-label={MSG_D14.PHOTO_UPLOADING}
            {...(upload.phase === 'uploading'
              ? { variant: 'determinate', value: upload.progress }
              : {})}
          />
        </Box>
      ) : null}
    </Box>
  );
}
