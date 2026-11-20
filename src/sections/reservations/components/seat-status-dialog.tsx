'use client';

// ----------------------------------------------------------------------
// 회차 좌석 현황 지도(U35 — design §14 SCR-D12): 잔여 n/총석 · 범례 · 지도. 예매 완료 칸을 누르면
// "B3 — 이름" + "이 예매 찾기"(목록 검색어를 그 이름으로).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';

import { AdminDialog } from '@/src/components/admin-dialog';
import { ErrorRetry } from '@/src/components/error-retry';
import {
  SeatGrid,
  SeatGridLegend,
  type SeatGridRowView,
} from '@/src/components/seat-grid';
import { Typo } from '@/src/components/typo';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_SEAT } from '@/src/shared/messages/seat';

export interface SeatStatusDialogProps {
  open: boolean;
  title: string;
  status: 'loading' | 'error' | 'empty' | 'ready';
  rows: SeatGridRowView[];
  remainingText: string;
  selectedText: string | null;
  onCellClick: (key: string) => void;
  onFind: () => void;
  onClose: () => void;
  onRetry: () => void;
}

export function SeatStatusDialog(props: SeatStatusDialogProps) {
  return (
    <AdminDialog
      open={props.open}
      title={props.title}
      wide
      onClose={props.onClose}
      actions={
        <Button variant='outlined' color='inherit' onClick={props.onClose}>
          {MSG_COMMON.CLOSE}
        </Button>
      }
    >
      {props.status === 'loading' ? (
        <Skeleton variant='rounded' height={200} />
      ) : props.status === 'error' ? (
        <ErrorRetry message={MSG_SEAT.LOAD_ERROR} onRetry={props.onRetry} />
      ) : props.status === 'empty' ? (
        <Typo.Body.Regular>{MSG_SEAT.STATUS_NO_LAYOUT}</Typo.Body.Regular>
      ) : (
        <div className='flex flex-col gap-3'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <Typo.Body.Semibold data-testid='seat-status-remaining'>
              {props.remainingText}
            </Typo.Body.Semibold>
            <Typo.Caption.Regular color='text.secondary'>
              {MSG_SEAT.STATUS_HINT}
            </Typo.Caption.Regular>
          </div>
          <SeatGridLegend
            ariaLabel={MSG_SEAT.LEGEND}
            items={[
              { tone: 'available', label: MSG_SEAT.LEGEND_AVAILABLE },
              { tone: 'sold', label: MSG_SEAT.LEGEND_SOLD },
            ]}
          />
          <SeatGrid
            rows={props.rows}
            stageLabel={MSG_SEAT.STAGE}
            ariaLabel={MSG_SEAT.STATUS_BUTTON}
            testId='seat-status-map'
            onCellClick={props.onCellClick}
          />
          {props.selectedText ? (
            <div className='flex flex-wrap items-center gap-2' role='status'>
              <Typo.Body.Semibold>{props.selectedText}</Typo.Body.Semibold>
              <Button size='small' variant='outlined' onClick={props.onFind}>
                {MSG_SEAT.STATUS_FIND}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </AdminDialog>
  );
}
