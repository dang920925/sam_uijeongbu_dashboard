// ----------------------------------------------------------------------
// 공연 관리(SCR-D03) View — 표/카드 + 페이지네이션(21건 이상일 때만, 표 아래 구분선). props 만으로 그린다.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Pagination } from '@/src/components/pagination';
import { PerformanceListTable } from '@/src/sections/performance-list/components/performance-list-table';
import type { PerformanceListRow } from '@/src/sections/performance-list/utils/to-performance-list-rows';

interface PerformanceListViewProps {
  rows: PerformanceListRow[];
  page: number;
  totalPages: number;
  hasPagination: boolean;
  onPageChange: (page: number) => void;
  onRowClick: (id: string) => void;
}

export function PerformanceListView({
  rows,
  page,
  totalPages,
  hasPagination,
  onPageChange,
  onRowClick,
}: PerformanceListViewProps) {
  return (
    <>
      <PerformanceListTable rows={rows} onRowClick={onRowClick} />
      {hasPagination ? (
        <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={onPageChange}
          />
        </Box>
      ) : null}
    </>
  );
}
