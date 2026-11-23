'use client';

// ----------------------------------------------------------------------
// 연습실 예약 상세(v1.3.1 사용자 요청 — 일정 캘린더 '연습실 예약' 레이어 칩을 누르면) — 팀 · 시간 · 작품 · 메모 +
// "팀이 등록한 연습실 예약…" 안내 + '예약 삭제'(관리자 — 확인 후 DELETE /admin/room-reservations/{id}).
// props 만으로 그린다(값·삭제는 ViewModel).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useId } from 'react';

import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import type { CalendarEvent } from '@/src/sections/schedules/utils/calendar-event';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D08 } from '@/src/shared/messages/d08';

interface RoomReservationDetailDialogProps {
  event: CalendarEvent | null;
  isDeleting: boolean;
  onDelete: () => void;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className='grid grid-cols-[72px_1fr] gap-2'>
      <Typo.Badge.Regular color='text.secondary'>{label}</Typo.Badge.Regular>
      <Typo.Badge.Medium sx={{ wordBreak: 'break-all' }}>
        {value}
      </Typo.Badge.Medium>
    </div>
  );
}

export function RoomReservationDetailDialog({
  event,
  isDeleting,
  onDelete,
  onClose,
}: RoomReservationDetailDialogProps) {
  const titleId = useId();
  const room = event?.room ?? null;
  return (
    <Dialog
      open={Boolean(event && room)}
      onClose={onClose}
      aria-labelledby={titleId}
      fullWidth
      maxWidth='xs'
    >
      {event && room ? (
        <>
          <DialogTitle id={titleId} className='flex flex-col gap-2'>
            <span>
              <Label tone='neutral'>{MSG_D08.ROOM_LAYER}</Label>
            </span>
            <Typo.Title.Bold component='span'>{event.title}</Typo.Title.Bold>
          </DialogTitle>
          <DialogContent
            className='flex flex-col gap-3'
            data-testid='room-reservation-detail'
          >
            <Row label={MSG_D08.ROOM_DETAIL_TEAM} value={room.teamName} />
            <Row
              label={MSG_D08.ROOM_DETAIL_TIME}
              value={`${event.date.replaceAll('-', '.')} ${event.timeText}`}
            />
            <Row
              label={MSG_D08.ROOM_DETAIL_PERFORMANCE}
              value={room.performanceTitle}
            />
            <Row
              label={MSG_D08.ROOM_DETAIL_MEMO}
              value={room.memo ?? MSG_COMMON.EMPTY_VALUE}
            />
            <Typo.Caption.Regular color='text.secondary'>
              {MSG_D08.ROOM_DETAIL_NOTE}
            </Typo.Caption.Regular>
          </DialogContent>
          <DialogActions className='justify-between'>
            <Button color='error' onClick={onDelete} disabled={isDeleting}>
              {MSG_D08.ROOM_DELETE}
            </Button>
            <Button variant='outlined' color='inherit' onClick={onClose}>
              {MSG_COMMON.CLOSE}
            </Button>
          </DialogActions>
        </>
      ) : null}
    </Dialog>
  );
}
