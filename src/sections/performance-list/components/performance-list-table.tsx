'use client';

// ----------------------------------------------------------------------
// 공연 표(md↑) / 카드 리스트(xs) — 열: 공연명(+포스터 썸네일) · 타입 · 상태 · 노출 · 등록일 · ›.
// 행 전체가 클릭·키보드(Enter·Space)로 상세(SCR-D04)를 연다(DataTable).
// ----------------------------------------------------------------------
import { DataTable, type DataTableColumn } from '@/src/components/data-table';
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { PerformanceListCard } from '@/src/sections/performance-list/components/performance-list-card';
import { PerformanceListThumb } from '@/src/sections/performance-list/components/performance-list-thumb';
import { PerformanceListVisibility } from '@/src/sections/performance-list/components/performance-list-visibility';
import type { PerformanceListRow } from '@/src/sections/performance-list/utils/to-performance-list-rows';
import { MSG_D03 } from '@/src/shared/messages/d03';

const COLUMNS: DataTableColumn<PerformanceListRow>[] = [
  {
    key: 'title',
    header: MSG_D03.COL_TITLE,
    render: (row) => (
      <div className='flex items-center gap-3'>
        <PerformanceListThumb posterImageUrl={row.posterImageUrl} />
        <Typo.Body.Semibold>{row.title}</Typo.Body.Semibold>
      </div>
    ),
  },
  {
    key: 'type',
    header: MSG_D03.COL_TYPE,
    render: (row) => <Typo.Badge.Regular>{row.typeLabel}</Typo.Badge.Regular>,
  },
  {
    key: 'status',
    header: MSG_D03.COL_STATUS,
    render: (row) => <Label tone={row.statusTone}>{row.statusLabel}</Label>,
  },
  {
    key: 'visible',
    header: MSG_D03.COL_VISIBLE,
    render: (row) => (
      <PerformanceListVisibility
        isVisible={row.isVisible}
        label={row.visibilityLabel}
      />
    ),
  },
  {
    key: 'created',
    header: MSG_D03.COL_CREATED,
    render: (row) => (
      <Typo.Caption.Regular color='text.secondary'>
        {row.createdLabel}
      </Typo.Caption.Regular>
    ),
  },
  {
    key: 'open',
    header: '',
    isCompact: true,
    render: () => (
      <Iconify
        icon='solar:alt-arrow-right-linear'
        sx={{ color: 'text.secondary' }}
      />
    ),
  },
];

interface PerformanceListTableProps {
  rows: PerformanceListRow[];
  onRowClick: (id: string) => void;
}

export function PerformanceListTable({
  rows,
  onRowClick,
}: PerformanceListTableProps) {
  return (
    <DataTable
      ariaLabel={MSG_D03.TABLE_ARIA}
      columns={COLUMNS}
      rows={rows}
      getRowKey={(row) => row.id}
      renderCard={(row) => <PerformanceListCard row={row} />}
      onRowClick={(row) => onRowClick(row.id)}
      getRowAriaLabel={(row) => MSG_D03.ROW_ARIA(row.title)}
    />
  );
}
