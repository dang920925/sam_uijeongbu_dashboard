'use client';

// ----------------------------------------------------------------------
// "반(Class) 관리" 카드 — 표(md↑: 반 이름·요일·시간·마감일·상태·수정·삭제) / xs 카드(DataTable).
// 상태: 로딩 스켈레톤 · 오류(다시 시도) · 빈 "등록된 반이 없습니다" · 목록.
// 아이콘 버튼 32(xs 44), 삭제는 빨강(designer "반 삭제 아이콘 버튼").
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import { DataTable, type DataTableColumn } from '@/src/components/data-table';
import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { TableSkeleton } from '@/src/components/table-skeleton';
import { Typo } from '@/src/components/typo';
import { PerformanceDetailSectionCard } from '@/src/sections/performance-detail/components/performance-detail-section-card';
import type { ClassRowDisplay } from '@/src/sections/performance-detail/utils/performance-detail-display';
import { MSG_D04 } from '@/src/shared/messages/d04';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface PerformanceDetailClassCardProps {
  isLoading: boolean;
  errorMessage: string | null;
  rows: ClassRowDisplay[];
  onRetry: () => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ICON_BUTTON_SX = { width: LAYOUT.controlSm, height: LAYOUT.controlSm };

export function PerformanceDetailClassCard({
  isLoading,
  errorMessage,
  rows,
  onRetry,
  onAdd,
  onEdit,
  onDelete,
}: PerformanceDetailClassCardProps) {
  const actions = (row: ClassRowDisplay) => (
    <div className='flex justify-end gap-1'>
      <IconButton
        aria-label={`${MSG_D04.CLASS_EDIT_ARIA} ${row.name}`}
        onClick={() => onEdit(row.id)}
        sx={{ ...ICON_BUTTON_SX, color: 'text.secondary' }}
      >
        <Iconify icon='solar:pen-linear' />
      </IconButton>
      <IconButton
        aria-label={`${MSG_D04.CLASS_DELETE_ARIA} ${row.name}`}
        onClick={() => onDelete(row.id)}
        sx={{ ...ICON_BUTTON_SX, color: 'error.main' }}
      >
        <Iconify icon='solar:trash-bin-trash-linear' />
      </IconButton>
    </div>
  );

  const secondary = (text: string) => (
    <Typo.Badge.Regular color='text.secondary'>{text}</Typo.Badge.Regular>
  );

  const columns: DataTableColumn<ClassRowDisplay>[] = [
    {
      key: 'name',
      header: MSG_D04.CLASS_COL_NAME,
      render: (row) => <Typo.Body.Semibold>{row.name}</Typo.Body.Semibold>,
    },
    {
      key: 'days',
      header: MSG_D04.CLASS_COL_DAYS,
      render: (row) => secondary(row.daysText),
    },
    {
      key: 'time',
      header: MSG_D04.CLASS_COL_TIME,
      render: (row) => secondary(row.timeText),
    },
    {
      key: 'deadline',
      header: MSG_D04.CLASS_COL_DEADLINE,
      render: (row) => secondary(row.deadlineText),
    },
    {
      key: 'status',
      header: MSG_D04.CLASS_COL_STATUS,
      render: (row) => <Label tone={row.statusTone}>{row.statusLabel}</Label>,
    },
    { key: 'actions', header: '', isCompact: true, render: actions },
  ];

  const body = isLoading ? (
    <TableSkeleton rows={3} />
  ) : errorMessage ? (
    <ErrorRetry message={errorMessage} onRetry={onRetry} />
  ) : rows.length === 0 ? (
    <EmptyContent message={MSG_D04.CLASS_EMPTY} />
  ) : (
    <DataTable
      ariaLabel={MSG_D04.CLASS_TABLE_ARIA}
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      renderCard={(row) => (
        <>
          <div className='flex items-center justify-between gap-2'>
            <Typo.Body.Semibold>{row.name}</Typo.Body.Semibold>
            <Label tone={row.statusTone}>{row.statusLabel}</Label>
          </div>
          <div className='flex flex-wrap gap-x-3 gap-y-1'>
            {secondary(row.daysText)}
            {secondary(row.timeText)}
            {secondary(`${MSG_D04.CARD_DEADLINE_PREFIX} ${row.deadlineText}`)}
          </div>
          {actions(row)}
        </>
      )}
    />
  );

  return (
    <PerformanceDetailSectionCard
      title={MSG_D04.CLASS_TITLE}
      isFlush
      action={
        <Button
          variant='contained'
          size='small'
          onClick={onAdd}
          startIcon={<Iconify icon='solar:add-circle-linear' />}
        >
          {MSG_D04.CLASS_ADD}
        </Button>
      }
    >
      {body}
    </PerformanceDetailSectionCard>
  );
}
