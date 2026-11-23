// ----------------------------------------------------------------------
// (U48) 사진 틀 — 비율 고정(단체·팀샷 16:9, 배역 = 공연의 배역 카드 비율) + 사진 + 순서 칩 + 올리는 중 덮개(진행 막대).
// (U51) 배역 사진은 저장된 위치대로 자르고(photoStyle), 단체·팀샷은 고른 비율이면 16:9 틀 가운데에 그 비율로 잘라(inner),
// 원본이면 지금처럼 잘리지 않게 전체(contain). 사진이 없으면 children(점선 올리기 버튼 등)을 그대로 채운다. props 만으로 렌더.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import type { CSSProperties, ReactNode } from 'react';

import { Typo } from '@/src/components/typo';
import { CroppedPhoto } from '@/src/sections/performance-cast/components/cropped-photo';
import type {
  CroppedView,
  PhotoUploadView,
} from '@/src/sections/performance-cast/utils/cast-photo-rows';
import { MSG_D14 } from '@/src/shared/messages/d14';
import { RADIUS } from '@/src/theme/layout-tokens';

interface CastPhotoFrameProps {
  /** 틀 비율(가로/세로) */
  ratio: number;
  imageUrl: string | null;
  /** 틀을 채우는 <img> 스타일(배역 — 저장된 위치). 없고 inner 도 없으면 전체(contain) */
  photoStyle?: CSSProperties | null;
  /** 단체·팀샷 잘라 보기 — 틀 가운데에 그 비율 상자 */
  inner?: CroppedView | null;
  alt: string;
  upload: PhotoUploadView | null;
  badge?: string;
  sizes?: string;
  children?: ReactNode;
}

export function CastPhotoFrame({
  ratio,
  imageUrl,
  photoStyle = null,
  inner = null,
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
        aspectRatio: `${ratio}`,
        overflow: 'hidden',
        borderRadius: `${RADIUS.sm}px`,
        bgcolor: imageUrl ? 'semantic.surface.muted' : 'transparent',
      }}
    >
      {imageUrl && inner ? (
        <Box
          sx={{
            position: 'relative',
            height: '100%',
            aspectRatio: `${inner.ratio}`,
            maxWidth: '100%',
            mx: 'auto',
            overflow: 'hidden',
          }}
        >
          <CroppedPhoto
            src={imageUrl}
            alt={alt}
            cropStyle={inner.style}
            sizes={sizes}
          />
        </Box>
      ) : imageUrl ? (
        // 단체·팀샷 원본은 세로가 긴 사진도 잘리지 않게 전체를 보여 준다(사용자 피드백)
        <CroppedPhoto
          src={imageUrl}
          alt={alt}
          cropStyle={photoStyle}
          sizes={sizes}
        />
      ) : (
        children
      )}
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
