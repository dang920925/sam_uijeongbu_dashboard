// ----------------------------------------------------------------------
// 상태 칸 — 상태 배지(대기 warning · 승인 success · 거절 error) + 등록됐으면 보조 배지 "단원 등록됨"(neutral, D6).
// ----------------------------------------------------------------------
import { Label } from '@/src/components/label';
import type { ApplicationRow } from '@/src/sections/applications/utils/application-row';
import { MSG_D06 } from '@/src/shared/messages/d06';

interface ApplicationStatusLabelsProps {
  row: ApplicationRow;
}

export function ApplicationStatusLabels({ row }: ApplicationStatusLabelsProps) {
  return (
    <span className='inline-flex flex-wrap items-center gap-1'>
      <Label tone={row.statusTone}>{row.statusLabel}</Label>
      {row.member ? <Label tone='neutral'>{MSG_D06.REGISTERED}</Label> : null}
    </span>
  );
}
