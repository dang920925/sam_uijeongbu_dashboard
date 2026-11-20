// ----------------------------------------------------------------------
// 목록 행 제목 — 취소 일정은 회색 취소선 + 아래 "취소 · {사유}"(U29 · 시안 SCR-D08-U29 cancelled-list).
// ----------------------------------------------------------------------
import { Typo } from '@/src/components/typo';
import type { ScheduleRow } from '@/src/sections/schedules/utils/schedule-row';

interface ScheduleTitleCellProps {
  row: ScheduleRow;
}

export function ScheduleTitleCell({ row }: ScheduleTitleCellProps) {
  if (!row.isCancelled)
    return <Typo.Body.Semibold>{row.title}</Typo.Body.Semibold>;
  return (
    <span className='flex flex-col'>
      <Typo.Body.Semibold
        color='text.secondary'
        sx={{ textDecoration: 'line-through' }}
      >
        {row.title}
      </Typo.Body.Semibold>
      {row.cancelText ? (
        <Typo.Caption.Regular color='semantic.text.onMuted'>
          {row.cancelText}
        </Typo.Caption.Regular>
      ) : null}
    </span>
  );
}
