'use client';

// ----------------------------------------------------------------------
// DataTable — 순정 MUI Table(dense) + xs 카드 리스트 자동 전환(가로 스크롤 금지, §11.7).
// - cardBelow 'md'(기본): md↑ 표 / 'lg': lg↑ 표 — 열이 많은 D06·D08·D10 (designer J-D7, `table-wrap--lg`).
// - 행 클릭이 있으면 표 행·카드 모두 키보드(Enter·Space)로도 연다.
// - 카드 모양은 화면이 renderCard 로 준다(필드 배치는 화면마다 다름).
// - DataGrid 미도입(가이드 §11.6).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { KeyboardEvent, ReactNode } from 'react';

/** Typo 의 'text.secondary' 는 이 CSS 변수로 풀린다(테마 cssVariables) */
const SECONDARY_VAR = '--mui-palette-text-secondary';
const ON_MUTED_VAR = 'var(--mui-palette-semantic-text-onMuted)';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** 액션·화살표 열 — 내용 폭만, 오른쪽 정렬 */
  isCompact?: boolean;
}

interface DataTableProps<T> {
  ariaLabel: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  renderCard: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  getRowAriaLabel?: (row: T) => string;
  selectedKey?: string | null;
  cardBelow?: 'md' | 'lg';
}

export function DataTable<T>({
  ariaLabel,
  columns,
  rows,
  getRowKey,
  renderCard,
  onRowClick,
  getRowAriaLabel,
  selectedKey,
  cardBelow = 'md',
}: DataTableProps<T>) {
  const tableDisplay =
    cardBelow === 'lg'
      ? { xs: 'none', lg: 'block' }
      : { xs: 'none', md: 'block' };
  const cardDisplay =
    cardBelow === 'lg'
      ? { xs: 'flex', lg: 'none' }
      : { xs: 'flex', md: 'none' };

  const handleKeyDown = (event: KeyboardEvent, row: T) => {
    if (!onRowClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <>
      <Box sx={{ display: tableDisplay }}>
        <Table aria-label={ariaLabel}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  align={col.align}
                  sx={
                    col.isCompact
                      ? { width: '1%', whiteSpace: 'nowrap' }
                      : undefined
                  }
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const key = getRowKey(row);
              const isSelected = selectedKey === key;
              return (
                <TableRow
                  key={key}
                  hover
                  selected={isSelected}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={
                    onRowClick && getRowAriaLabel
                      ? getRowAriaLabel(row)
                      : undefined
                  }
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={(event) => handleKeyDown(event, row)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:last-child td': { borderBottom: 0 },
                    '&.Mui-selected, &.Mui-selected:hover': {
                      bgcolor: 'semantic.surface.muted',
                      // 선택 행(slate-100) 위 부가 글자는 slate-600 — text.secondary 변수를 행 범위에서만 바꾼다(qa1 QA1-006)
                      [SECONDARY_VAR]: ON_MUTED_VAR,
                    },
                    '&:hover': { bgcolor: 'semantic.surface.hover' },
                    '&:focus-visible': {
                      outline: 2,
                      outlineColor: 'primary.main',
                      outlineOffset: -2,
                    },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      align={col.isCompact ? 'right' : col.align}
                      sx={
                        col.isCompact
                          ? { width: '1%', whiteSpace: 'nowrap' }
                          : undefined
                      }
                    >
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <Box
        component='ul'
        aria-label={ariaLabel}
        sx={{
          display: cardDisplay,
          flexDirection: 'column',
          m: 0,
          p: 0,
          listStyle: 'none',
        }}
      >
        {rows.map((row) => {
          const key = getRowKey(row);
          return (
            <Box
              component='li'
              key={key}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? 'button' : undefined}
              aria-label={
                onRowClick && getRowAriaLabel ? getRowAriaLabel(row) : undefined
              }
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={(event) => handleKeyDown(event, row)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 4,
                borderBottom: 1,
                borderColor: 'divider',
                cursor: onRowClick ? 'pointer' : 'default',
                bgcolor:
                  selectedKey === key
                    ? 'semantic.surface.muted'
                    : 'transparent',
                ...(selectedKey === key
                  ? { [SECONDARY_VAR]: ON_MUTED_VAR }
                  : {}),
                '&:last-of-type': { borderBottom: 0 },
                '&:focus-visible': {
                  outline: 2,
                  outlineColor: 'primary.main',
                  outlineOffset: -2,
                },
              }}
            >
              {renderCard(row)}
            </Box>
          );
        })}
      </Box>
    </>
  );
}
