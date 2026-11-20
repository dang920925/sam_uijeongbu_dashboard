'use client';

// ----------------------------------------------------------------------
// 일정 상세 내용 — 팝오버(md↑)·아래 시트(xs) 공용(design .cal-popover).
// 유형 Label(+ "취소") · 제목 · (취소면 "취소 · {사유}" 상자 + "참관 받지 않음") · 날짜 시간 · 장소 · 설명 · 연결 공연/반 ·
// 버튼 줄: 왼쪽 "일정 취소"/"취소 해제"(outlined) — 삭제(빨강 글자)·수정(contained)과 떨어뜨림(designer §14.3).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import type { ScheduleDetail } from '@/src/sections/schedules/utils/schedule-detail';
import type { ScheduleRowHandlers } from '@/src/sections/schedules/utils/schedule-row';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D08 } from '@/src/shared/messages/d08';
import { RADIUS } from '@/src/theme/layout-tokens';

interface ScheduleDetailContentProps {
  detail: ScheduleDetail;
  titleId: string;
  isSheet: boolean;
  handlers: ScheduleRowHandlers;
  onClose: () => void;
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className='flex items-start gap-2'>
      <Iconify
        icon={icon}
        sx={{ color: 'text.secondary', mt: 1, flexShrink: 0 }}
      />
      <Typo.Badge.Regular sx={{ overflowWrap: 'anywhere' }}>
        {text}
      </Typo.Badge.Regular>
    </div>
  );
}

export function ScheduleDetailContent({
  detail,
  titleId,
  isSheet,
  handlers,
  onClose,
}: ScheduleDetailContentProps) {
  const buttonSx = isSheet ? { flex: 1 } : undefined;
  return (
    <>
      <div className='flex flex-col gap-2 px-4 pt-4 pb-4'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <Label tone={detail.typeTone} variant={detail.typeVariant}>
              {detail.typeLabel}
            </Label>
            {detail.isCancelled ? (
              <Label tone='neutral'>{MSG_D08.CANCELLED_TAG}</Label>
            ) : null}
          </div>
          <IconButton
            aria-label={MSG_COMMON.CLOSE}
            onClick={onClose}
            sx={{ mr: -2, mt: -2, color: 'text.secondary' }}
          >
            <Iconify icon='solar:close-circle-linear' size='md' />
          </IconButton>
        </div>
        <Typo.Title.Bold
          component='h2'
          id={titleId}
          color={detail.isCancelled ? 'text.secondary' : 'text.primary'}
          sx={{
            textDecoration: detail.isCancelled ? 'line-through' : 'none',
            overflowWrap: 'anywhere',
          }}
        >
          {detail.title}
        </Typo.Title.Bold>
        {detail.cancelText ? (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 2,
              px: 3,
              py: 2,
              border: 1,
              borderStyle: 'dashed',
              borderColor: 'text.disabled',
              borderRadius: `${RADIUS.sm}px`,
            }}
          >
            <Iconify
              icon='solar:forbidden-circle-linear'
              sx={{ color: 'text.secondary' }}
            />
            <Typo.Badge.Semibold>{detail.cancelText}</Typo.Badge.Semibold>
            {detail.observationClosed ? (
              <Label tone='neutral'>{MSG_D08.OBSERVATION_CLOSED}</Label>
            ) : null}
          </Box>
        ) : null}
        <InfoRow icon='solar:clock-circle-linear' text={detail.whenText} />
        {detail.location ? (
          <InfoRow icon='solar:map-point-linear' text={detail.location} />
        ) : null}
        {detail.description ? (
          <InfoRow
            icon='solar:document-text-linear'
            text={detail.description}
          />
        ) : null}
        {detail.linkText ? (
          <InfoRow icon='solar:masks-linear' text={detail.linkText} />
        ) : null}
      </div>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2,
          px: 4,
          py: 3,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        {detail.isCancelled ? (
          <Button
            variant='outlined'
            color='inherit'
            startIcon={<Iconify icon='solar:undo-left-linear' />}
            onClick={() => handlers.onRestore(detail.id)}
            sx={buttonSx}
          >
            {MSG_D08.RESTORE}
          </Button>
        ) : (
          <Button
            variant='outlined'
            color='inherit'
            startIcon={<Iconify icon='solar:forbidden-circle-linear' />}
            onClick={() => handlers.onCancel(detail.id)}
            sx={buttonSx}
          >
            {MSG_D08.CANCEL}
          </Button>
        )}
        <Box sx={{ flex: 1, display: isSheet ? 'none' : 'block' }} />
        <Button
          variant='text'
          color='error'
          startIcon={<Iconify icon='solar:trash-bin-trash-linear' />}
          onClick={() => handlers.onDelete(detail.id)}
          sx={buttonSx}
        >
          {MSG_COMMON.DELETE}
        </Button>
        <Button
          variant='contained'
          startIcon={<Iconify icon='solar:pen-linear' />}
          onClick={() => handlers.onEdit(detail.id)}
          sx={buttonSx}
        >
          {MSG_COMMON.EDIT}
        </Button>
      </Box>
    </>
  );
}
