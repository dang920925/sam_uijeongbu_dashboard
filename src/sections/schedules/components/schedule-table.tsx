'use client';

// ----------------------------------------------------------------------
// 일정 표 — 제목·타입·시작 시간·종료 시간·장소·액션(현행 Schedules.tsx:189-194). lg 미만은 카드(cardBelow 'lg').
// ----------------------------------------------------------------------
import { DataTable, type DataTableColumn } from '@/src/components/data-table';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { ScheduleCard } from '@/src/sections/schedules/components/schedule-card';
import { ScheduleRowActions } from '@/src/sections/schedules/components/schedule-row-actions';
import type {
  ScheduleRow,
  ScheduleRowHandlers,
} from '@/src/sections/schedules/utils/schedule-row';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D08 } from '@/src/shared/messages/d08';

interface ScheduleTableProps {
  rows: ScheduleRow[];
  handlers: ScheduleRowHandlers;
}

export function ScheduleTable({ rows, handlers }: ScheduleTableProps) {
  const secondary = (value: string | null) => (
    <Typo.Badge.Regular color='text.secondary'>
      {value ?? MSG_COMMON.EMPTY_VALUE}
    </Typo.Badge.Regular>
  );
  const columns: DataTableColumn<ScheduleRow>[] = [
    {
      key: 'title',
      header: MSG_D08.COL_TITLE,
      render: (row) => <Typo.Body.Semibold>{row.title}</Typo.Body.Semibold>,
    },
    {
      key: 'type',
      header: MSG_D08.COL_TYPE,
      render: (row) => (
        <Label tone={row.typeTone} variant={row.typeVariant}>
          {row.typeLabel}
        </Label>
      ),
    },
    {
      key: 'start',
      header: MSG_D08.COL_START,
      render: (row) => secondary(row.startAt),
    },
    {
      key: 'end',
      header: MSG_D08.COL_END,
      render: (row) => secondary(row.endAt),
    },
    {
      key: 'location',
      header: MSG_D08.COL_LOCATION,
      render: (row) => secondary(row.location),
    },
    {
      key: 'actions',
      header: MSG_D08.COL_ACTIONS,
      isCompact: true,
      render: (row) => <ScheduleRowActions row={row} handlers={handlers} />,
    },
  ];
  return (
    <DataTable
      ariaLabel={MSG_D08.TITLE}
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      renderCard={(row) => <ScheduleCard row={row} handlers={handlers} />}
      cardBelow='lg'
    />
  );
}
