// ----------------------------------------------------------------------
// 목록 행 타입 배지 + (취소면) "취소" Label(U29 · 시안 SCR-D08-U29 cancelled-list).
// ----------------------------------------------------------------------
import { Label } from '@/src/components/label';
import type { ScheduleRow } from '@/src/sections/schedules/utils/schedule-row';
import { MSG_D08 } from '@/src/shared/messages/d08';

interface ScheduleTypeLabelsProps {
  row: ScheduleRow;
}

export function ScheduleTypeLabels({ row }: ScheduleTypeLabelsProps) {
  return (
    <span className='inline-flex flex-wrap items-center gap-2'>
      <Label tone={row.typeTone} variant={row.typeVariant}>
        {row.typeLabel}
      </Label>
      {row.isCancelled ? (
        <Label tone='neutral'>{MSG_D08.CANCELLED_TAG}</Label>
      ) : null}
    </span>
  );
}
