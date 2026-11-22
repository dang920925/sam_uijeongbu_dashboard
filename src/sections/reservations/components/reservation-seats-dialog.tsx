'use client';

// ----------------------------------------------------------------------
// 좌석 변경 Dialog(U35 — design §14 SCR-D12 "좌석 변경"): 회차 좌석 지도에서 매수만큼 고른다.
// 파란 칸 = 지금 이 예매의 좌석, 다른 예매 좌석은 ✕(누를 수 없음). 409 SEAT_001·RSV_007 은 Dialog 위 오류.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
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

export interface ReservationSeatsDialogProps {
  open: boolean;
  title: string;
  help: string;
  status: 'loading' | 'error' | 'empty' | 'ready';
  rows: SeatGridRowView[];
  pickedText: string;
  canSubmit: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCellClick: (key: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  onRetry: () => void;
}

export function ReservationSeatsDialog(props: ReservationSeatsDialogProps) {
  return (
    <AdminDialog
      open={props.open}
      title={props.title}
      wide
      onClose={props.onClose}
      onSubmit={props.onSubmit}
      errorMessage={props.errorMessage}
      isBusy={props.isSubmitting}
      actions={
        <>
          <Button
            variant='outlined'
            color='inherit'
            onClick={props.onClose}
            disabled={props.isSubmitting}
          >
            {MSG_COMMON.CANCEL}
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={!props.canSubmit || props.isSubmitting}
            startIcon={
              props.isSubmitting ? (
                <CircularProgress size={16} color='inherit' />
              ) : undefined
            }
          >
            {MSG_SEAT.CHANGE_SUBMIT}
          </Button>
        </>
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
          <Typo.Caption.Regular color='text.secondary'>
            {props.help}
          </Typo.Caption.Regular>
          <SeatGridLegend
            ariaLabel={MSG_SEAT.LEGEND}
            items={[
              { tone: 'available', label: MSG_SEAT.LEGEND_AVAILABLE },
              { tone: 'selected', label: MSG_SEAT.LEGEND_SELECTED },
              { tone: 'mine', label: MSG_SEAT.LEGEND_MINE },
              { tone: 'sold', label: MSG_SEAT.LEGEND_SOLD },
            ]}
          />
          <SeatGrid
            rows={props.rows}
            stageLabel={MSG_SEAT.STAGE}
            ariaLabel={MSG_SEAT.CHANGE_ACTION}
            testId='reservation-seat-map'
            onCellClick={props.onCellClick}
          />
          <Typo.Badge.Semibold
            role='status'
            data-testid='reservation-seat-picked'
          >
            {props.pickedText}
          </Typo.Badge.Semibold>
        </div>
      )}
    </AdminDialog>
  );
}
