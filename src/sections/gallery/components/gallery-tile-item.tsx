'use client';

// ----------------------------------------------------------------------
// 갤러리 정사각 타일 — 이미지 + 오버레이(덮개 scrim.image · 카테고리 칩 · 설명 2줄 말줄임 · "삭제").
// 오버레이는 hover·focus-within 때 보이고, 터치 기기(@media (hover: none))는 항상 보인다(D11, designer SCR-D07).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { Iconify } from '@/src/components/iconify';
import { Image } from '@/src/components/image';
import { Typo } from '@/src/components/typo';
import type { GalleryTileModel } from '@/src/sections/gallery/utils/gallery-tile';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { RADIUS } from '@/src/theme/layout-tokens';
import { MOTION } from '@/src/theme/motion';

interface GalleryTileItemProps {
  tile: GalleryTileModel;
  onDelete: (id: string) => void;
}

const IMAGE_SIZES = '(min-width: 1024px) 20vw, (min-width: 768px) 25vw, 50vw';

export function GalleryTileItem({ tile, onDelete }: GalleryTileItemProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        aspectRatio: '1 / 1',
        overflow: 'hidden',
        borderRadius: `${RADIUS.md}px`,
        bgcolor: 'semantic.surface.muted',
        '&:hover .gallery-overlay, &:focus-within .gallery-overlay': {
          opacity: 1,
        },
      }}
    >
      <Image src={tile.imageUrl} alt={tile.alt} sizes={IMAGE_SIZES} />
      <Box
        className='gallery-overlay'
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 2,
          bgcolor: 'semantic.scrim.image',
          color: 'semantic.text.onImage',
          opacity: 0,
          transition: `opacity ${MOTION.duration.short}ms ${MOTION.easing.standard}`,
          '@media (hover: none)': { opacity: 1 },
        }}
      >
        {tile.categoryLabel ? (
          <Box
            component='span'
            sx={{
              px: 2,
              borderRadius: `${RADIUS.pill}px`,
              bgcolor: 'semantic.scrim.chip',
            }}
          >
            <Typo.Caption.Medium color='inherit'>
              {tile.categoryLabel}
            </Typo.Caption.Medium>
          </Box>
        ) : null}
        {tile.description ? (
          <Typo.Caption.Regular
            color='inherit'
            sx={{
              textAlign: 'center',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-all',
            }}
          >
            {tile.description}
          </Typo.Caption.Regular>
        ) : null}
        <Button
          variant='contained'
          color='error'
          size='small'
          onClick={() => onDelete(tile.id)}
          startIcon={<Iconify icon='solar:trash-bin-trash-linear' />}
        >
          {MSG_COMMON.DELETE}
        </Button>
      </Box>
    </Box>
  );
}
