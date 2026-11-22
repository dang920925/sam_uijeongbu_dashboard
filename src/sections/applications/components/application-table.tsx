'use client';

// ----------------------------------------------------------------------
// 신청 한 행 목록(U31 보강 — designer §18.3 SCR-D06-U31B).
// - lg 7열 한 줄(말줄임): 유형 · 이름/연락처 · 작품 · 희망 일정 · 연락 · 진행 · 접수일.
// - md 5열: 희망 일정·연락처·접수일은 드로어로. xs 는 카드(ApplicationCard).
// - (U39) 처리 상태 열을 없앴다(진행 단계로 합침). "단원 등록됨"은 진행 칸 옆 배지(md 아이콘만).
// - 행 클릭 → 드로어. 키보드는 이름 버튼(시안 row-open)으로 연다. 연락 토글·진행 메뉴 클릭은 행으로 번지지 않는다.
// - 열마다 폭 비율(table-layout fixed)로 한 줄을 지키고, 글자는 말줄임.
// 공용 DataTable 은 열 단위 반응형 숨김이 없어 이 화면만 MUI Table 을 직접 쓴다(리드 보고).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { ReactNode } from 'react';

import { Typo } from '@/src/components/typo';
import { ApplicationCard } from '@/src/sections/applications/components/application-card';
import { ApplicationContactToggle } from '@/src/sections/applications/components/application-contact-toggle';
import { ApplicationProgressMenu } from '@/src/sections/applications/components/application-progress-menu';
import { ApplicationScheduleCell } from '@/src/sections/applications/components/application-schedule-cell';
import { ApplicationSortHeader } from '@/src/sections/applications/components/application-sort-header';
import { ApplicationMemberLabel } from '@/src/sections/applications/components/application-member-label';
import { ApplicationTypeLabel } from '@/src/sections/applications/components/application-type-label';
import { ApplicationWorkChips } from '@/src/sections/applications/components/application-work-chips';
import type {
  ApplicationRow,
  ApplicationRowHandlers,
} from '@/src/sections/applications/utils/application-row';
import { MSG_D06 } from '@/src/shared/messages/d06';
import type { ApplicationSort } from '@/src/types/codes';

type AriaSort = 'ascending' | 'descending' | 'none';

interface ApplicationTableProps {
  rows: ApplicationRow[];
  handlers: ApplicationRowHandlers;
  selectedId: string | null;
  sortState: Record<ApplicationSort, AriaSort>;
  onSort: (sort: ApplicationSort) => void;
}

interface Column {
  key: string;
  header: ReactNode;
  /** lg 폭 비율(%) */
  width: { md: string; lg: string };
  isLgOnly?: boolean;
  sort?: ApplicationSort;
  render: (row: ApplicationRow) => ReactNode;
}

const LG_ONLY = { xs: 'none', lg: 'table-cell' } as const;

export function ApplicationTable({
  rows,
  handlers,
  selectedId,
  sortState,
  onSort,
}: ApplicationTableProps) {
  const columns: Column[] = [
    {
      key: 'type',
      header: MSG_D06.COL_TYPE,
      width: { md: '11%', lg: '6%' },
      render: (row) => <ApplicationTypeLabel row={row} />,
    },
    {
      key: 'name',
      header: (
        <>
          <Box component='span' sx={{ display: { xs: 'none', lg: 'inline' } }}>
            {MSG_D06.COL_NAME_PHONE}
          </Box>
          <Box component='span' sx={{ display: { xs: 'inline', lg: 'none' } }}>
            {MSG_D06.COL_NAME}
          </Box>
        </>
      ),
      width: { md: '20%', lg: '16%' },
      render: (row) => (
        <span className='flex min-w-0 items-baseline gap-2'>
          <ButtonBase
            aria-haspopup='dialog'
            onClick={(event) => {
              event.stopPropagation();
              handlers.onView(row.id);
            }}
            sx={{
              flexShrink: 0,
              minWidth: 0,
              maxWidth: '100%',
              borderRadius: 1,
            }}
          >
            <Typo.Body.Semibold noWrap>{row.applicantName}</Typo.Body.Semibold>
          </ButtonBase>
          <Typo.Caption.Regular
            color='text.secondary'
            noWrap
            sx={{ display: { xs: 'none', lg: 'block' }, minWidth: 0 }}
          >
            {row.phone}
          </Typo.Caption.Regular>
        </span>
      ),
    },
    {
      key: 'work',
      header: MSG_D06.COL_WORK,
      width: { md: '28%', lg: '22%' },
      render: (row) => (
        <>
          <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
            <ApplicationWorkChips
              split={row.workChips.lg}
              isEmpty={row.isWorkEmpty}
            />
          </Box>
          <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
            <ApplicationWorkChips
              split={row.workChips.md}
              isEmpty={row.isWorkEmpty}
            />
          </Box>
        </>
      ),
    },
    {
      key: 'schedule',
      header: MSG_D06.COL_SCHEDULE,
      width: { md: '0', lg: '18%' },
      isLgOnly: true,
      render: (row) => <ApplicationScheduleCell row={row} isNoWrap />,
    },
    {
      key: 'contact',
      header: MSG_D06.COL_CONTACT,
      width: { md: '18%', lg: '11%' },
      sort: 'contactedAt',
      render: (row) => (
        <ApplicationContactToggle
          contact={row.contact}
          hasTime
          onToggle={(contacted) => handlers.onToggleContact(row.id, contacted)}
        />
      ),
    },
    {
      key: 'progress',
      header: MSG_D06.COL_PROGRESS,
      width: { md: '23%', lg: '17%' },
      sort: 'progress',
      render: (row) => (
        <span className='inline-flex items-center gap-1'>
          <ApplicationProgressMenu
            progress={row.progress}
            onChange={(progress) => handlers.onChangeProgress(row.id, progress)}
          />
          <ApplicationMemberLabel row={row} isIconOnlyMd />
        </span>
      ),
    },
    {
      key: 'created',
      header: MSG_D06.COL_RECEIVED,
      width: { md: '0', lg: '10%' },
      isLgOnly: true,
      sort: 'createdAt',
      render: (row) => (
        <Typo.Badge.Regular color='text.secondary' noWrap>
          {row.createdAt}
        </Typo.Badge.Regular>
      ),
    },
  ];

  return (
    <>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Table aria-label={MSG_D06.TITLE} sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  aria-sort={col.sort ? sortState[col.sort] : undefined}
                  sx={{
                    width: col.width,
                    px: 2,
                    display: col.isLgOnly ? LG_ONLY : undefined,
                  }}
                >
                  {col.sort ? (
                    <ApplicationSortHeader
                      label={String(col.header)}
                      ariaSort={sortState[col.sort]}
                      onSort={() => onSort(col.sort as ApplicationSort)}
                    />
                  ) : (
                    col.header
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                hover
                selected={selectedId === row.id}
                onClick={() => handlers.onView(row.id)}
                sx={{
                  cursor: 'pointer',
                  '&:last-child td': { borderBottom: 0 },
                  '&.Mui-selected, &.Mui-selected:hover': {
                    bgcolor: 'semantic.surface.muted',
                  },
                  '&:hover': { bgcolor: 'semantic.surface.hover' },
                }}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    sx={{
                      px: 2,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      display: col.isLgOnly ? LG_ONLY : undefined,
                    }}
                  >
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Box
        component='ul'
        aria-label={MSG_D06.TITLE}
        sx={{
          display: { xs: 'flex', md: 'none' },
          flexDirection: 'column',
          m: 0,
          p: 0,
          listStyle: 'none',
        }}
      >
        {rows.map((row) => (
          <ApplicationCard
            key={row.id}
            row={row}
            isSelected={selectedId === row.id}
            onOpen={() => handlers.onView(row.id)}
          />
        ))}
      </Box>
    </>
  );
}
