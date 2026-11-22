'use client';

// ----------------------------------------------------------------------
// 수동 등록 좌석 고르기(U35 — 선택, J-104): "좌석 고르기"를 누르면 회차 좌석 지도(SeatGrid) → 매수만큼 고른다.
// 비우면 "좌석 미정". props 만으로 렌더.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';

import { ErrorRetry } from '@/src/components/error-retry';
import { FormField } from '@/src/components/form-field';
import {
  SeatGrid,
  SeatGridLegend,
  type SeatGridRowView,
} from '@/src/components/seat-grid';
import { Typo } from '@/src/components/typo';
import { MSG_SEAT } from '@/src/shared/messages/seat';

export interface SeatPickerFieldProps {
  status: 'loading' | 'error' | 'ready';
  isOpen: boolean;
  rows: SeatGridRowView[];
  pickedText: string;
  /** 매수 0 이면 안내만 */
  hasQuantity: boolean;
  error: string | null;
  onOpen: () => void;
  onClear: () => void;
  onCellClick: (key: string) => void;
  onRetry: () => void;
}

export function SeatPickerField(props: SeatPickerFieldProps) {
  const label = (
    <>
      {MSG_SEAT.MANUAL_SEAT}{' '}
      <Typo.Badge.Regular color='text.secondary'>
        {MSG_SEAT.MANUAL_SEAT_OPTIONAL}
      </Typo.Badge.Regular>
    </>
  );
  if (!props.isOpen) {
    return (
      <FormField label={label} asGroup>
        <div>
          <Button
            variant='outlined'
            color='inherit'
            onClick={props.onOpen}
            disabled={!props.hasQuantity}
          >
            {MSG_SEAT.MANUAL_SEAT_OPEN}
          </Button>
        </div>
        {!props.hasQuantity ? (
          <Typo.Caption.Regular color='text.secondary'>
            {MSG_SEAT.MANUAL_SEAT_NO_QTY}
          </Typo.Caption.Regular>
        ) : null}
      </FormField>
    );
  }
  return (
    <FormField label={label} asGroup error={props.error}>
      {props.status === 'loading' ? (
        <Skeleton variant='rounded' height={160} />
      ) : props.status === 'error' ? (
        <ErrorRetry message={MSG_SEAT.LOAD_ERROR} onRetry={props.onRetry} />
      ) : (
        <div className='flex flex-col gap-2'>
          <SeatGridLegend
            ariaLabel={MSG_SEAT.LEGEND}
            items={[
              { tone: 'available', label: MSG_SEAT.LEGEND_AVAILABLE },
              { tone: 'selected', label: MSG_SEAT.LEGEND_SELECTED },
              { tone: 'sold', label: MSG_SEAT.LEGEND_SOLD },
            ]}
          />
          <SeatGrid
            rows={props.rows}
            stageLabel={MSG_SEAT.STAGE}
            ariaLabel={MSG_SEAT.MANUAL_SEAT}
            testId='manual-seat-map'
            onCellClick={props.onCellClick}
          />
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <Typo.Badge.Semibold role='status' data-testid='manual-seat-picked'>
              {props.pickedText}
            </Typo.Badge.Semibold>
            <Button size='small' color='inherit' onClick={props.onClear}>
              {MSG_SEAT.MANUAL_SEAT_CLEAR}
            </Button>
          </div>
        </div>
      )}
    </FormField>
  );
}
