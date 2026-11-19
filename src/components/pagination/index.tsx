'use client';

// ----------------------------------------------------------------------
// Pagination — ‹ 번호 ›. totalPages ≤ 1 이면 그리지 않는다(21건 이상일 때만 — design SCR-D03·D06).
// 페이지 버튼 40, xs 44.
// ----------------------------------------------------------------------
import MuiPagination from '@mui/material/Pagination';

import { MSG_COMMON } from '@/src/shared/messages/common';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className='flex justify-center p-3'>
      <MuiPagination
        page={page}
        count={totalPages}
        onChange={(_, value) => onChange(value)}
        shape='rounded'
        getItemAriaLabel={(type, itemPage) => {
          if (type === 'previous') return MSG_COMMON.PREV_PAGE;
          if (type === 'next') return MSG_COMMON.NEXT_PAGE;
          return String(itemPage);
        }}
        sx={{
          '& .MuiPaginationItem-root': {
            minWidth: { xs: 44, md: 40 },
            height: { xs: 44, md: 40 },
            borderRadius: 2,
          },
          '& .MuiPaginationItem-root.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          },
        }}
      />
    </div>
  );
}
