// ----------------------------------------------------------------------
// 집계 표 카드(designer tab-summary) — 제목(h2) · 설명 · 표(첫 열 굵게, 합계 줄 옅은 배경, "직접 입력"·"초대 없음" 흐리게).
// xs 는 카드 안에서만 가로 스크롤(페이지 넘침 0).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { Typo } from '@/src/components/typo';
import type { SummaryTable } from '@/src/sections/reservations/utils/summary-view';

interface SummaryTableCardProps {
  title: string;
  caption: string;
  table: SummaryTable;
}

export function SummaryTableCard({
  title,
  caption,
  table,
}: SummaryTableCardProps) {
  return (
    <Card component='section' aria-label={title}>
      <div className='flex flex-col gap-1 px-4 pt-4 pb-3 md:px-6 md:pt-6'>
        <Typo.Title.Bold component='h2'>{title}</Typo.Title.Bold>
        <Typo.Caption.Regular color='text.secondary'>
          {caption}
        </Typo.Caption.Regular>
      </div>
      <Box sx={{ overflowX: 'auto' }}>
        <Table aria-label={title} sx={{ minWidth: { xs: 560, md: 0 } }}>
          <TableHead>
            <TableRow>
              {table.columns.map((column) => (
                <TableCell key={column} sx={{ whiteSpace: 'nowrap' }}>
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {table.rows.map((row) => (
              <TableRow
                key={row.key}
                sx={{
                  bgcolor: row.isTotal ? 'semantic.surface.hover' : undefined,
                  '&:last-child td': { borderBottom: 0 },
                }}
              >
                {row.cells.map((cell, index) =>
                  index === 0 ? (
                    <TableCell
                      key={index}
                      component='th'
                      scope='row'
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {row.isTotal ? (
                        <Typo.Badge.Bold>{cell}</Typo.Badge.Bold>
                      ) : (
                        <Typo.Body.Semibold
                          color={row.isMuted ? 'text.secondary' : undefined}
                        >
                          {cell}
                        </Typo.Body.Semibold>
                      )}
                    </TableCell>
                  ) : (
                    <TableCell key={index} sx={{ whiteSpace: 'nowrap' }}>
                      {row.isTotal ? (
                        <Typo.Badge.Bold>{cell}</Typo.Badge.Bold>
                      ) : (
                        <Typo.Badge.Regular>{cell}</Typo.Badge.Regular>
                      )}
                    </TableCell>
                  )
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}
