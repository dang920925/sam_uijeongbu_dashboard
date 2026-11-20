// ----------------------------------------------------------------------
// 처리 상태 칸 — 상태 배지(대기 warning · 승인 success · 거절 error) + 등록됐으면 옆에 "단원 등록됨"(neutral + 아이콘, D6·designer §18.3).
// ----------------------------------------------------------------------
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import type { ApplicationRow } from '@/src/sections/applications/utils/application-row';
import { MSG_D06 } from '@/src/shared/messages/d06';

interface ApplicationStatusLabelsProps {
  row: ApplicationRow;
  /** 목록 한 줄 — "단원 등록됨"을 옆에 두고 줄바꿈하지 않는다 */
  isNoWrap?: boolean;
}

export function ApplicationStatusLabels({
  row,
  isNoWrap = false,
}: ApplicationStatusLabelsProps) {
  return (
    <span
      className={
        isNoWrap
          ? 'inline-flex items-center gap-1'
          : 'inline-flex flex-wrap items-center gap-1'
      }
    >
      <Label tone={row.statusTone}>{row.statusLabel}</Label>
      {row.member ? (
        <Label tone='neutral'>
          <span className='inline-flex items-center gap-1'>
            <Iconify icon='solar:user-check-rounded-linear' />
            {/* 목록 md 는 아이콘만(시안 default md) — 글자는 스크린리더에 남긴다 */}
            <span className={isNoWrap ? 'sr-only lg:not-sr-only' : undefined}>
              {MSG_D06.REGISTERED}
            </span>
          </span>
        </Label>
      ) : null}
    </span>
  );
}
