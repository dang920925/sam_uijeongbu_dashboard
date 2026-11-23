'use client';

// ----------------------------------------------------------------------
// (U51) 조정 창 무대 — 원본 전체 + 금색 틀(밖은 scrim 으로 어둡게, 모서리 4개, 초점 점) + 썸네일 원(designer §21.2).
// - 틀은 포커스 가능(role=group, aria-roledescription "위치 틀") — 화살표 1%·Shift 10%·+/− 확대. 끄는 동안 3분할선 + 값 표시.
// - 썸네일 탭이면 카드 틀은 점선(움직이지 않음), 원이 금색 대상. 원본 비율(단체·팀샷)이면 틀 없이 원본만.
// 무대 높이 상한 lg 400 · xs 288(가로는 원본 비율대로). props 만으로 렌더(끌기 처리는 use-crop-gestures 가 준 handler).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import NextImage from 'next/image';
import type { KeyboardEvent, PointerEvent } from 'react';

import { Typo } from '@/src/components/typo';
import type { PhotoCropEditor } from '@/src/sections/performance-cast/view/use-photo-crop-editor';
import { MSG_D14 } from '@/src/shared/messages/d14';
import { RADIUS } from '@/src/theme/layout-tokens';

interface PhotoCropStageProps {
  editor: PhotoCropEditor;
  gestures: {
    onPointerDown: (event: PointerEvent<HTMLElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  };
  liveId: string;
}

const STAGE_MAX = { xs: 288, md: 400 } as const;

type Placement = { left: number; top: number; width: number; height: number };

const place = (p: Placement) => ({
  left: `${p.left}%`,
  top: `${p.top}%`,
  width: `${p.width}%`,
  height: `${p.height}%`,
});

const CORNER = 16;
const CORNERS = [
  { left: 0, top: 0, borderLeftWidth: 4, borderTopWidth: 4 },
  { right: 0, top: 0, borderRightWidth: 4, borderTopWidth: 4 },
  { left: 0, bottom: 0, borderLeftWidth: 4, borderBottomWidth: 4 },
  { right: 0, bottom: 0, borderRightWidth: 4, borderBottomWidth: 4 },
];

const THIRDS =
  'linear-gradient(to right, transparent calc(33.33% - 0.5px), currentColor 0, currentColor calc(33.33% + 0.5px), transparent 0, transparent calc(66.66% - 0.5px), currentColor 0, currentColor calc(66.66% + 0.5px), transparent 0), linear-gradient(to bottom, transparent calc(33.33% - 0.5px), currentColor 0, currentColor calc(33.33% + 0.5px), transparent 0, transparent calc(66.66% - 0.5px), currentColor 0, currentColor calc(66.66% + 0.5px), transparent 0)';

function Tag({ label, isActive }: { label: string; isActive: boolean }) {
  return (
    <Box
      component='span'
      className='absolute left-4 top-0 whitespace-nowrap px-2'
      sx={{
        borderRadius: `0 0 ${RADIUS.xs}px ${RADIUS.xs}px`,
        bgcolor: isActive ? 'primary.main' : 'background.paper',
        color: isActive ? 'primary.contrastText' : 'text.primary',
      }}
    >
      <Typo.Caption.Semibold color='inherit'>{label}</Typo.Caption.Semibold>
    </Box>
  );
}

export function PhotoCropStage({
  editor,
  gestures,
  liveId,
}: PhotoCropStageProps) {
  const { model, size } = editor;
  const aspect = size ? size.width / size.height : 4 / 3;
  const isThumb = editor.target === 'thumb';
  const canDrag = Boolean(model?.canAdjust);
  const frameLabel =
    editor.kind === 'role'
      ? MSG_D14.CROP_FRAME_CARD(editor.ratioLabel)
      : MSG_D14.CROP_FRAME_WIDE(editor.ratioLabel);
  const thumbLabel = model?.isThumbAuto
    ? MSG_D14.CROP_FRAME_THUMB_AUTO
    : MSG_D14.CROP_FRAME_THUMB;

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (editor.onKey(event.key, event.shiftKey)) event.preventDefault();
  };
  const scrim = (t: { palette: { semantic: { scrim: { image: string } } } }) =>
    `0 0 0 100vmax ${t.palette.semantic.scrim.image}`;
  const focusRing = {
    '&:focus-visible': {
      outline: 3,
      outlineColor: 'semantic.nav.brand',
      outlineOffset: 3,
    },
  };

  return (
    <Box
      data-testid='crop-stage'
      {...(canDrag ? gestures : {})}
      sx={{
        position: 'relative',
        mx: 'auto',
        width: {
          xs: `min(100%, ${STAGE_MAX.xs * aspect}px)`,
          md: `min(100%, ${STAGE_MAX.md * aspect}px)`,
        },
        aspectRatio: `${aspect}`,
        overflow: 'hidden',
        borderRadius: `${RADIUS.sm}px`,
        bgcolor: 'background.default',
        touchAction: canDrag ? 'none' : 'auto',
        userSelect: 'none',
        cursor: canDrag ? (editor.isDragging ? 'grabbing' : 'grab') : 'default',
      }}
    >
      <NextImage
        src={editor.imageUrl}
        alt=''
        fill
        unoptimized
        draggable={false}
        sizes='640px'
        style={{ objectFit: 'contain' }}
        onLoad={(event) =>
          editor.onImageLoad(
            event.currentTarget.naturalWidth,
            event.currentTarget.naturalHeight
          )
        }
        onError={editor.onImageError}
      />
      {model?.cardFrame ? (
        <Box
          tabIndex={isThumb ? -1 : 0}
          role='group'
          aria-roledescription='위치 틀'
          aria-label={MSG_D14.CROP_FRAME_ARIA(frameLabel)}
          aria-describedby={liveId}
          data-testid='crop-frame'
          onKeyDown={isThumb ? undefined : onKeyDown}
          sx={{
            position: 'absolute',
            ...place(model.cardFrame),
            boxShadow: isThumb ? 'none' : scrim,
            outline: isThumb ? 1 : 2,
            outlineStyle: isThumb ? 'dashed' : 'solid',
            outlineColor: isThumb ? 'text.primary' : 'primary.main',
            color: 'text.primary',
            ...focusRing,
          }}
        >
          {!isThumb
            ? CORNERS.map((corner, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'absolute',
                    width: CORNER,
                    height: CORNER,
                    borderStyle: 'solid',
                    borderWidth: 0,
                    borderColor: 'primary.main',
                    ...corner,
                  }}
                />
              ))
            : null}
          {!isThumb && editor.isDragging ? (
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                opacity: 0.35,
                backgroundImage: THIRDS,
              }}
            />
          ) : null}
          {!isThumb ? (
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 12,
                height: 12,
                transform: 'translate(-50%, -50%)',
                borderRadius: `${RADIUS.pill}px`,
                border: 2,
                borderColor: 'primary.main',
                bgcolor: 'semantic.scrim.chip',
              }}
            />
          ) : null}
          <Tag label={frameLabel} isActive={!isThumb} />
        </Box>
      ) : null}
      {model?.thumbFrame ? (
        <Box
          tabIndex={isThumb ? 0 : -1}
          role={isThumb ? 'group' : undefined}
          aria-roledescription={isThumb ? '위치 틀' : undefined}
          aria-label={isThumb ? MSG_D14.CROP_FRAME_ARIA(thumbLabel) : undefined}
          aria-describedby={isThumb ? liveId : undefined}
          aria-hidden={isThumb ? undefined : true}
          data-testid='crop-thumb-ring'
          onKeyDown={isThumb ? onKeyDown : undefined}
          sx={{
            position: 'absolute',
            ...place(model.thumbFrame),
            borderRadius: `${RADIUS.pill}px`,
            outline: isThumb ? 2 : 1,
            outlineStyle: isThumb ? 'solid' : 'dashed',
            outlineColor: isThumb ? 'primary.main' : 'text.primary',
            boxShadow: isThumb ? scrim : 'none',
            pointerEvents: 'none',
            ...focusRing,
          }}
        >
          <Box
            component='span'
            className='absolute bottom-0 right-0 whitespace-nowrap px-1'
            sx={{
              transform: 'translateY(100%)',
              borderRadius: `${RADIUS.xs}px`,
              bgcolor: isThumb ? 'primary.main' : 'semantic.scrim.image',
              color: isThumb ? 'primary.contrastText' : 'semantic.text.onImage',
            }}
          >
            <Typo.Caption.Medium color='inherit'>
              {thumbLabel}
            </Typo.Caption.Medium>
          </Box>
        </Box>
      ) : null}
      <Box
        component='span'
        className='absolute bottom-2 left-2 px-2'
        sx={{
          borderRadius: `${RADIUS.pill}px`,
          bgcolor: 'semantic.scrim.image',
          color: 'semantic.text.onImage',
        }}
      >
        <Typo.Caption.Regular color='inherit'>
          {MSG_D14.CROP_STAGE_TAG}
        </Typo.Caption.Regular>
      </Box>
      {editor.isDragging && canDrag ? (
        <Box
          aria-hidden
          className='absolute right-2 top-2 px-2 py-1'
          sx={{
            borderRadius: `${RADIUS.pill}px`,
            bgcolor: 'semantic.scrim.image',
            color: 'semantic.text.onImage',
          }}
        >
          <Typo.Caption.Medium color='inherit'>
            {editor.readout}
          </Typo.Caption.Medium>
        </Box>
      ) : null}
    </Box>
  );
}
