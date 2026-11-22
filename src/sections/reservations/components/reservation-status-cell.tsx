// ----------------------------------------------------------------------
// 상태 칸 — 공용 ReservationStatusLabel + 무료(info) · 관리자 등록(neutral) · (R2) 일부 입금(warning) + 기한/취소 사유·받은 금액 caption.
// ----------------------------------------------------------------------
import { Label } from '@/src/components/label';
import { ReservationStatusLabel } from '@/src/components/reservation-status-label';
import { Typo } from '@/src/components/typo';
import type { ReservationRow } from '@/src/sections/reservations/utils/reservation-row';
import { MSG_D12 } from '@/src/shared/messages/d12';
import { MSG_DEP } from '@/src/shared/messages/deposit-notifications';

interface ReservationStatusCellProps {
  row: ReservationRow;
}

export function ReservationStatusCell({ row }: ReservationStatusCellProps) {
  return (
    <span className='flex flex-col items-start gap-1'>
      <span className='inline-flex flex-wrap items-center gap-1'>
        <ReservationStatusLabel
          status={row.status}
          deadlinePassed={row.deadlinePassed}
          confirmedBy={row.confirmedBy}
        />
        {row.isFree ? <Label tone='info'>{MSG_D12.FREE_LABEL}</Label> : null}
        {row.isAdmin ? (
          <Label tone='neutral'>{MSG_D12.ADMIN_LABEL}</Label>
        ) : null}
        {row.partialDepositText ? (
          <Label tone='warning'>{MSG_DEP.STATUS.PARTIAL}</Label>
        ) : null}
      </span>
      {row.partialDepositText ? (
        <Typo.Caption.Regular color='text.secondary'>
          {row.partialDepositText}
        </Typo.Caption.Regular>
      ) : null}
      {row.statusNote ? (
        <Typo.Caption.Regular color='text.secondary'>
          {row.statusNote}
        </Typo.Caption.Regular>
      ) : null}
    </span>
  );
}
