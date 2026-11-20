'use client';

// ----------------------------------------------------------------------
// 상태 처리 버튼(표·카드·드로어 공용) — designer §13.7.3 2.1:
// 입금 대기 = "입금 확인"(contained) + "취소"(text error) / 확정 = "확인 취소"(outlined) + "취소" /
// 취소됨 = "되살리기"(outlined). 입장 인원이 있는 확정 건은 둘 다 비활성 + RSV_009 이유(표 Tooltip · 카드 글자).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import type { MouseEvent } from 'react';

import { Iconify } from '@/src/components/iconify';
import type { ReservationRow } from '@/src/sections/reservations/utils/reservation-row';
import { MSG_D12 } from '@/src/shared/messages/d12';

export interface ReservationRowHandlers {
  onConfirm: (id: string) => void;
  onUnconfirm: (id: string) => void;
  onRequestCancel: (id: string) => void;
  onRestore: (id: string) => void;
  onRequestItems: (id: string) => void;
  onRequestMemo: (id: string) => void;
  onOpenDetail: (id: string) => void;
  /** U35 좌석 변경 — 좌석 지정 공연일 때만 */
  onRequestSeats?: (id: string) => void;
}

interface ReservationActionButtonsProps {
  row: Pick<ReservationRow, 'id' | 'code' | 'status' | 'isLocked'>;
  handlers: ReservationRowHandlers;
  isBusy: boolean;
  /** 표 — 비활성 이유를 Tooltip 으로(카드·드로어는 아래 글자로) */
  withTooltip?: boolean;
}

const BUTTON_SX = {
  minHeight: { xs: 44, lg: 32 },
  flex: { xs: 1, md: 'none' },
  whiteSpace: 'nowrap',
};

/** 행 클릭(상세 열기)으로 번지지 않게 */
const stop =
  (run: () => void) =>
  (event: MouseEvent): void => {
    event.stopPropagation();
    run();
  };

export function ReservationActionButtons({
  row,
  handlers,
  isBusy,
  withTooltip = false,
}: ReservationActionButtonsProps) {
  const cancelButton = (
    <Button
      variant='text'
      color='error'
      size='small'
      disabled={isBusy || row.isLocked}
      onClick={stop(() => handlers.onRequestCancel(row.id))}
      sx={BUTTON_SX}
    >
      {MSG_D12.ACT_CANCEL}
    </Button>
  );
  if (row.status === 'CANCELLED')
    return (
      <Button
        variant='outlined'
        color='inherit'
        size='small'
        disabled={isBusy}
        startIcon={<Iconify icon='solar:restart-linear' />}
        onClick={stop(() => handlers.onRestore(row.id))}
        sx={BUTTON_SX}
      >
        {MSG_D12.ACT_RESTORE}
      </Button>
    );
  if (row.status === 'PENDING')
    return (
      <>
        <Button
          variant='contained'
          size='small'
          disabled={isBusy}
          startIcon={<Iconify icon='solar:check-circle-linear' />}
          onClick={stop(() => handlers.onConfirm(row.id))}
          sx={BUTTON_SX}
        >
          {MSG_D12.ACT_CONFIRM}
        </Button>
        {cancelButton}
      </>
    );
  const buttons = (
    <>
      <Button
        variant='outlined'
        color='inherit'
        size='small'
        disabled={isBusy || row.isLocked}
        startIcon={<Iconify icon='solar:undo-left-linear' />}
        onClick={stop(() => handlers.onUnconfirm(row.id))}
        sx={BUTTON_SX}
      >
        {MSG_D12.ACT_UNCONFIRM}
      </Button>
      {cancelButton}
    </>
  );
  // disabled 버튼은 hover 이벤트가 없어 span 으로 감싼다(designer §5 충돌 6)
  return withTooltip && row.isLocked ? (
    <Tooltip title={MSG_D12.LOCKED_REASON}>
      <span className='inline-flex items-center gap-2'>{buttons}</span>
    </Tooltip>
  ) : (
    buttons
  );
}
