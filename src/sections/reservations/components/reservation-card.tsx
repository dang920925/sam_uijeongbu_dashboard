'use client';

// ----------------------------------------------------------------------
// 예매 카드(lg 미만) — designer default xs: "[0000] · [이름]" + 아이콘 → 연락처 · 회차 →
// 등급별 매수 · 총 n매 · 금액(직접 입력) → 입금자명 · 입장 · 초대 → 상태 줄 → 처리 버튼 줄(44, xs 반반) → 잠금 이유.
// ----------------------------------------------------------------------
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import {
  ReservationActionButtons,
  type ReservationRowHandlers,
} from '@/src/sections/reservations/components/reservation-action-buttons';
import { ReservationIconActions } from '@/src/sections/reservations/components/reservation-icon-actions';
import { ReservationStatusCell } from '@/src/sections/reservations/components/reservation-status-cell';
import type { ReservationRow } from '@/src/sections/reservations/utils/reservation-row';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D12 } from '@/src/shared/messages/d12';
import { MSG_SEAT } from '@/src/shared/messages/seat';

interface ReservationCardProps {
  row: ReservationRow;
  handlers: ReservationRowHandlers;
  isBusy: boolean;
}

function Meta({ children }: { children: string }) {
  return (
    <Typo.Badge.Regular color='text.secondary'>{children}</Typo.Badge.Regular>
  );
}

export function ReservationCard({
  row,
  handlers,
  isBusy,
}: ReservationCardProps) {
  const amount = row.isAmountOverridden
    ? `${row.amountText} (${MSG_D12.OVERRIDDEN})`
    : row.amountText;
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-start justify-between gap-2'>
        <div className='flex min-w-0 flex-col gap-1'>
          <Typo.Body.Semibold>{`${row.code} · ${row.bookerName}`}</Typo.Body.Semibold>
          <Typo.Caption.Regular color='text.secondary'>
            {`${row.phoneText} · ${row.showText}`}
          </Typo.Caption.Regular>
        </div>
        <ReservationIconActions row={row} handlers={handlers} />
      </div>
      <div className='flex flex-wrap gap-x-3 gap-y-1'>
        <Typo.Badge.Regular>{row.tierText}</Typo.Badge.Regular>
        {row.hasDiscount ? (
          <Label tone='info'>{MSG_D12.LINK_ONLY}</Label>
        ) : null}
        <Meta>{row.totalQtyText}</Meta>
        <Typo.Badge.Regular>{amount}</Typo.Badge.Regular>
      </div>
      <div className='flex flex-wrap gap-x-3 gap-y-1'>
        {row.depositorText !== MSG_COMMON.EMPTY_VALUE ? (
          <Meta>{`${MSG_D12.DEPOSITOR} ${row.depositorText}`}</Meta>
        ) : null}
        {row.seatText ? (
          <Meta>{`${MSG_SEAT.COLUMN} ${row.seatText}`}</Meta>
        ) : null}
        <Meta>{`${MSG_D12.ADMISSION} ${row.admissionText}`}</Meta>
        {row.inviterText !== MSG_COMMON.EMPTY_VALUE ? (
          <Meta>
            {`${MSG_D12.INVITER} ${row.inviterText}${row.appliedPriceText ? ` · ${row.appliedPriceText}` : ''}`}
          </Meta>
        ) : null}
      </div>
      <ReservationStatusCell row={row} />
      <div className='flex flex-wrap gap-2 pt-1'>
        <ReservationActionButtons
          row={row}
          handlers={handlers}
          isBusy={isBusy}
        />
      </div>
      {row.isLocked ? (
        <Typo.Caption.Regular color='text.secondary'>
          {MSG_D12.LOCKED_REASON}
        </Typo.Caption.Regular>
      ) : null}
    </div>
  );
}
