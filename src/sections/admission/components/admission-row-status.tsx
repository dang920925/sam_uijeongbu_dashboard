// ----------------------------------------------------------------------
// 행 상태 줄 — 상태는 색 + 글자: 확정·입금 대기 Label(+ 금액 · 기한 지남), 다 들어온 행은 "입장 완료"(아이콘 + 글자),
// 관리자 등록 Label(neutral) · 메모 한 줄(아이콘 + 글자 — 누르는 버튼 아님, designer §13.7.4 1.8).
// ----------------------------------------------------------------------
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { ReservationStatusLabel } from '@/src/components/reservation-status-label';
import { Typo } from '@/src/components/typo';
import type { AdmissionRowModel } from '@/src/sections/admission/utils/admission-row';
import { MSG_D13 } from '@/src/shared/messages/d13';

interface AdmissionRowStatusProps {
  row: AdmissionRowModel;
  /** lg 표는 "입장 완료"를 상태 칸에 함께 둔다 */
  showDone?: boolean;
}

export function AdmissionRowStatus({
  row,
  showDone = false,
}: AdmissionRowStatusProps) {
  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
      {row.kind === 'done' ? (
        showDone ? (
          <span className='inline-flex items-center gap-1'>
            <Iconify
              icon='solar:check-circle-linear'
              size='md'
              sx={{ color: 'success.main' }}
            />
            <Typo.Badge.Semibold color='success.main'>
              {MSG_D13.DONE}
            </Typo.Badge.Semibold>
          </span>
        ) : null
      ) : (
        <ReservationStatusLabel
          status={row.status}
          deadlinePassed={row.deadlinePassed}
        />
      )}
      {row.kind === 'pending' ? (
        <Typo.Badge.Semibold>{row.amountText}</Typo.Badge.Semibold>
      ) : null}
      {row.isAdminSource ? (
        <Label tone='neutral'>{MSG_D13.ADMIN_SOURCE}</Label>
      ) : null}
      {row.memo ? (
        <span className='inline-flex min-w-0 items-center gap-1'>
          <Iconify
            icon='solar:notebook-linear'
            sx={{ color: 'text.secondary' }}
          />
          <Typo.Badge.Regular color='text.secondary'>
            {row.memo}
          </Typo.Badge.Regular>
        </span>
      ) : null}
    </div>
  );
}
