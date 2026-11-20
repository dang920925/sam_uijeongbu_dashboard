'use client';

// ----------------------------------------------------------------------
// md·xs 카드(designer W4 D08 — 6열·날짜 2개라 lg 미만은 카드): 제목+타입 배지 / 시작 시간 / 종료 시간 / 장소, 오른쪽 수정·취소·삭제.
// U29: 취소 일정은 제목 취소선 + "취소 · {사유}" + "취소" Label.
// ----------------------------------------------------------------------
import { Typo } from '@/src/components/typo';
import { ScheduleRowActions } from '@/src/sections/schedules/components/schedule-row-actions';
import { ScheduleTitleCell } from '@/src/sections/schedules/components/schedule-title-cell';
import { ScheduleTypeLabels } from '@/src/sections/schedules/components/schedule-type-labels';
import type {
  ScheduleRow,
  ScheduleRowHandlers,
} from '@/src/sections/schedules/utils/schedule-row';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D08 } from '@/src/shared/messages/d08';

interface ScheduleCardProps {
  row: ScheduleRow;
  handlers: ScheduleRowHandlers;
}

export function ScheduleCard({ row, handlers }: ScheduleCardProps) {
  return (
    <div className='flex items-start justify-between gap-2'>
      <div className='flex min-w-0 flex-col gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <ScheduleTitleCell row={row} />
          <ScheduleTypeLabels row={row} />
        </div>
        <Typo.Badge.Regular color='text.secondary'>
          {`${MSG_D08.COL_START} ${row.startAt}`}
        </Typo.Badge.Regular>
        <Typo.Badge.Regular color='text.secondary'>
          {`${MSG_D08.COL_END} ${row.endAt ?? MSG_COMMON.EMPTY_VALUE}`}
        </Typo.Badge.Regular>
        <Typo.Badge.Regular color='text.secondary'>
          {`${MSG_D08.COL_LOCATION} ${row.location ?? MSG_COMMON.EMPTY_VALUE}`}
        </Typo.Badge.Regular>
      </div>
      <ScheduleRowActions row={row} handlers={handlers} />
    </div>
  );
}
