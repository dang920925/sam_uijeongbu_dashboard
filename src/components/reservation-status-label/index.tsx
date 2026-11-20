// ----------------------------------------------------------------------
// ReservationStatusLabel — 예매 상태 Label(design §6.2, D12·D13 공용).
// 입금 대기 warning · 확정 success · 취소 neutral outline, 기한 지남은 error 글자(입금 대기일 때만),
// (designer `.overdue` — hourglass 아이콘 + 글자), R2 자동 확정은 info 보조 Label(confirmedBy = AUTO). 상태는 색 + 글자로 함께 알린다(접근성).
// ----------------------------------------------------------------------
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { MSG_BOOKING } from '@/src/shared/messages/booking';
import type { ConfirmedBy, ReservationStatus } from '@/src/types/booking';
import { RESERVATION_STATUS_LABEL } from '@/src/types/codes';
import { RESERVATION_STATUS_TONE } from '@/src/utils/status-tone';

interface ReservationStatusLabelProps {
  status: ReservationStatus;
  deadlinePassed?: boolean;
  confirmedBy?: ConfirmedBy | null;
}

export function ReservationStatusLabel({
  status,
  deadlinePassed = false,
  confirmedBy = null,
}: ReservationStatusLabelProps) {
  return (
    <span className='inline-flex flex-wrap items-center gap-1'>
      <Label
        tone={RESERVATION_STATUS_TONE[status]}
        variant={status === 'CANCELLED' ? 'outline' : 'soft'}
      >
        {RESERVATION_STATUS_LABEL[status]}
      </Label>
      {status === 'CONFIRMED' && confirmedBy === 'AUTO' ? (
        <Label tone='info'>{MSG_BOOKING.AUTO_CONFIRMED}</Label>
      ) : null}
      {status === 'PENDING' && deadlinePassed ? (
        <Typo.Caption.Semibold
          className='inline-flex items-center gap-1'
          sx={{ color: 'semantic.alert.errorFg' }}
        >
          <Iconify icon='solar:hourglass-linear' size='sm' />
          {MSG_BOOKING.DEADLINE_PASSED}
        </Typo.Caption.Semibold>
      ) : null}
    </span>
  );
}
