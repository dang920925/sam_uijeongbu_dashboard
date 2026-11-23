'use client';

// ----------------------------------------------------------------------
// (U51) SCR-D14 '보이는 위치 조정' 창(designer §21.2 · U51-CROP.html) — MUI Dialog(포커스 가둠·Esc 닫기 기본).
// lg: 가운데 창 960 — 왼쪽 [맞출 대상 | 보이는 비율] → 무대 → 확대·되돌리기, 오른쪽 320 미리보기.
// xs: 전체 화면 시트 — 무대 바로 아래 미리보기(끄는 동안 손가락에 가리지 않게), 하단 [취소][저장] 고정(DialogActions).
// 값은 aria-live 로 읽어 준다. props 만으로 렌더(끌기·키 처리는 container 가 준 editor·gestures).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Slider from '@mui/material/Slider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useId, type ComponentProps, type ReactNode } from 'react';

import { Iconify } from '@/src/components/iconify';
import { SegmentPill } from '@/src/components/segment-pill';
import { Typo } from '@/src/components/typo';
import { PhotoCropPreview } from '@/src/sections/performance-cast/components/photo-crop-preview';
import { PhotoCropStage } from '@/src/sections/performance-cast/components/photo-crop-stage';
import {
  CROP_LIMIT,
  PHOTO_ASPECTS,
  type PhotoAspect,
} from '@/src/sections/performance-cast/utils/photo-crop';
import type { CropEditTarget } from '@/src/sections/performance-cast/utils/photo-crop-editor';
import type { PhotoCropEditor } from '@/src/sections/performance-cast/view/use-photo-crop-editor';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D14 } from '@/src/shared/messages/d14';
import { LAYOUT, RADIUS } from '@/src/theme/layout-tokens';

interface PhotoCropDialogProps {
  editor: PhotoCropEditor;
  gestures: ComponentProps<typeof PhotoCropStage>['gestures'];
}

type Tone = 'info' | 'warning' | 'error';

function Note({
  tone,
  icon,
  children,
}: {
  tone: Tone;
  icon: string;
  children: ReactNode;
}) {
  return (
    <Box
      role={tone === 'info' ? 'note' : 'alert'}
      className='flex items-start gap-2 px-4 py-3'
      sx={{
        borderRadius: `${RADIUS.sm}px`,
        border: 1,
        borderColor:
          tone === 'info' ? 'transparent' : `semantic.alert.${tone}Border`,
        bgcolor: `semantic.alert.${tone}Bg`,
        color: `semantic.alert.${tone}Fg`,
      }}
    >
      <Iconify icon={icon} sx={{ flexShrink: 0 }} />
      <Typo.Caption.Medium color='inherit'>{children}</Typo.Caption.Medium>
    </Box>
  );
}

const ZOOM_MIN = CROP_LIMIT.zoomMin * 100;
const ZOOM_MAX = CROP_LIMIT.zoomMax * 100;

export function PhotoCropDialog({ editor, gestures }: PhotoCropDialogProps) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('md'));
  const titleId = useId();
  const liveId = useId();
  const model = editor.model;
  const canAdjust = Boolean(model?.canAdjust);
  const isRole = editor.kind === 'role';

  const targetOptions: { value: CropEditTarget; label: string }[] = [
    { value: 'card', label: MSG_D14.CROP_TARGET_CARD(editor.ratioLabel) },
    {
      value: 'thumb',
      label: model?.isThumbAuto
        ? MSG_D14.CROP_TARGET_THUMB_AUTO
        : MSG_D14.CROP_TARGET_THUMB,
    },
  ];
  const aspectOptions = PHOTO_ASPECTS.map((value: PhotoAspect) => ({
    value,
    label: MSG_D14.RATIO_LABEL(value),
  }));

  const stage = editor.loadFailed ? (
    <Note tone='error' icon='solar:danger-circle-linear'>
      {MSG_D14.CROP_LOAD_FAILED}
    </Note>
  ) : (
    <div className='relative'>
      <PhotoCropStage editor={editor} gestures={gestures} liveId={liveId} />
      {editor.isLoading ? (
        <Skeleton
          variant='rounded'
          aria-label={MSG_D14.CROP_LOADING}
          sx={{ position: 'absolute', inset: 0, height: '100%' }}
        />
      ) : null}
    </div>
  );

  const tools = (
    <div className='flex flex-col gap-2' style={{ gridArea: 'tools' }}>
      <div className='flex items-center gap-2'>
        <IconButton
          aria-label={MSG_D14.CROP_ZOOM_OUT}
          disabled={!canAdjust}
          onClick={() => editor.onZoomStep(-CROP_LIMIT.zoomStep)}
          sx={{ width: LAYOUT.touch, height: LAYOUT.touch }}
        >
          <Iconify icon='solar:minus-circle-linear' size='md' />
        </IconButton>
        <Slider
          aria-label={MSG_D14.CROP_ZOOM}
          getAriaValueText={(v) => `${v}%`}
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={CROP_LIMIT.zoomSlider * 100}
          value={editor.zoomPercent}
          disabled={!canAdjust}
          onChange={(_, value) =>
            editor.onZoom((Array.isArray(value) ? value[0] : value) / 100)
          }
          sx={{ flex: 1, minWidth: 0, mx: 2 }}
        />
        <IconButton
          aria-label={MSG_D14.CROP_ZOOM_IN}
          disabled={!canAdjust}
          onClick={() => editor.onZoomStep(CROP_LIMIT.zoomStep)}
          sx={{ width: LAYOUT.touch, height: LAYOUT.touch }}
        >
          <Iconify icon='solar:add-circle-linear' size='md' />
        </IconButton>
        <Typo.Badge.Semibold
          component='output'
          sx={{ minWidth: 48, textAlign: 'right' }}
        >
          {`${editor.zoomPercent}%`}
        </Typo.Badge.Semibold>
      </div>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Button
          variant='text'
          color='inherit'
          disabled={!canAdjust}
          onClick={editor.onReset}
          startIcon={<Iconify icon='solar:restart-linear' />}
        >
          {MSG_D14.CROP_RESET}
        </Button>
        {canAdjust ? (
          <Typo.Caption.Regular color='text.secondary'>
            {editor.readout}
          </Typo.Caption.Regular>
        ) : null}
      </div>
      {isRole && editor.target === 'thumb' && !model?.isThumbAuto ? (
        <Button
          variant='text'
          color='inherit'
          onClick={editor.onThumbAuto}
          startIcon={<Iconify icon='solar:refresh-linear' />}
          sx={{ alignSelf: 'flex-start' }}
        >
          {MSG_D14.CROP_THUMB_AUTO}
        </Button>
      ) : null}
      {model?.isBlurry ? (
        <Note tone='warning' icon='solar:danger-triangle-linear'>
          {MSG_D14.CROP_BLUR}
        </Note>
      ) : null}
      {canAdjust ? (
        <span className='flex items-start gap-1'>
          <Iconify
            icon='solar:hand-shake-linear'
            size='sm'
            sx={{ color: 'text.secondary', flexShrink: 0 }}
          />
          <Typo.Caption.Regular color='text.secondary'>
            {MSG_D14.CROP_HINT}
          </Typo.Caption.Regular>
        </span>
      ) : null}
    </div>
  );

  return (
    <Dialog
      open
      onClose={editor.onCancel}
      fullScreen={isXs}
      aria-labelledby={titleId}
      data-testid='photo-crop-dialog'
      slotProps={{
        paper: {
          sx: {
            width: '100%',
            maxWidth: LAYOUT.dialogCrop,
            m: { xs: 0, md: 4 },
          },
        },
      }}
    >
      <DialogTitle
        id={`${titleId}-title`}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 3,
          px: { xs: 4, md: 6 },
          pt: { xs: 3, md: 6 },
          pb: { xs: 3, md: 4 },
          borderBottom: { xs: 1, md: 0 },
          borderColor: 'divider',
        }}
      >
        <span className='flex min-w-0 flex-col gap-1'>
          <Typo.Title.Bold component='span' id={titleId}>
            {MSG_D14.CROP_TITLE}
          </Typo.Title.Bold>
          <Typo.Caption.Regular color='text.secondary'>
            {MSG_D14.CROP_SUB(editor.who)}
          </Typo.Caption.Regular>
        </span>
        <IconButton
          aria-label={MSG_COMMON.CLOSE}
          onClick={editor.onCancel}
          disabled={editor.isSaving}
          sx={{ mr: -2, color: 'text.secondary' }}
        >
          <Iconify icon='solar:close-circle-linear' size='md' />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 4, md: 6 }, pt: { xs: 4, md: 0 } }}>
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 4, md: 6 },
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              md: `minmax(0, 1fr) ${LAYOUT.panel}px`,
            },
            gridTemplateAreas: {
              xs: '"head" "stage" "preview" "tools"',
              md: '"head preview" "stage preview" "tools preview"',
            },
            gridTemplateRows: { md: 'auto auto 1fr' },
            pt: { xs: 0, md: 1 },
          }}
        >
          <div
            className='flex min-w-0 flex-col gap-3'
            style={{ gridArea: 'head' }}
          >
            {editor.isNew ? (
              <Note tone='info' icon='solar:info-circle-linear'>
                {isRole ? MSG_D14.CROP_NEW_ROLE : MSG_D14.CROP_NEW_WIDE}
              </Note>
            ) : null}
            {isRole ? (
              <SegmentPill
                options={targetOptions}
                value={editor.target}
                onChange={editor.onTarget}
                ariaLabel={MSG_D14.CROP_TARGET_ARIA}
              />
            ) : (
              <div className='flex flex-col gap-1'>
                <Typo.Badge.Semibold component='span'>
                  {MSG_D14.CROP_RATIO_ARIA}
                </Typo.Badge.Semibold>
                <SegmentPill
                  options={aspectOptions}
                  value={editor.aspect}
                  onChange={editor.onAspect}
                  ariaLabel={MSG_D14.CROP_RATIO_ARIA}
                />
              </div>
            )}
          </div>
          <div
            className='flex min-w-0 flex-col gap-2'
            style={{ gridArea: 'stage' }}
          >
            {stage}
            {!canAdjust && !editor.isLoading && !editor.loadFailed ? (
              <Typo.Caption.Regular color='text.secondary'>
                {MSG_D14.CROP_ORIGINAL_NOTE}
              </Typo.Caption.Regular>
            ) : null}
          </div>
          <Box sx={{ gridArea: 'preview', minWidth: 0 }}>
            <PhotoCropPreview editor={editor} />
          </Box>
          {tools}
        </Box>
        <span id={liveId} className='sr-only' aria-live='polite'>
          {canAdjust ? editor.readout : MSG_D14.CROP_ORIGINAL_NOTE}
        </span>
        {editor.errorMessage ? (
          <Box className='mt-4'>
            <Note tone='error' icon='solar:danger-circle-linear'>
              {editor.errorMessage}
            </Note>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions
        sx={{
          px: { xs: 4, md: 6 },
          py: { xs: 3, md: 6 },
          gap: 2,
          borderTop: 1,
          borderColor: 'divider',
          '& > :not(style) ~ :not(style)': { ml: 0 },
          '& > .MuiButton-root': { flex: { xs: 1, md: 'none' } },
        }}
      >
        <Button
          variant='outlined'
          color='inherit'
          onClick={editor.onCancel}
          disabled={editor.isSaving}
        >
          {MSG_D14.CROP_CANCEL}
        </Button>
        <Button
          variant='contained'
          onClick={editor.onSave}
          disabled={editor.isSaving || editor.isLoading || editor.loadFailed}
        >
          {MSG_D14.CROP_SAVE}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
