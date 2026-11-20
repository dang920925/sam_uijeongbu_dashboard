'use client';

// ----------------------------------------------------------------------
// SCR-D14 회차별 캐스팅(design §6 SCR-D14 ②) — lg 격자(행 = 배역, 열 = 회차, 열이 많으면 격자 안에서만 가로 스크롤),
// xs·md 회차 고르기 + 배역 목록(한 회차씩). 칸: 회차 지정이면 강조 + "해제", 아니면 흐린 "기본". 칸 누르기 → 배우 고르기.
// 회차 0 → "회차·예매 탭에서 회차를 먼저 추가해주세요." · 배역 0 → "등록된 배역이 없습니다". 회차 선택만 화면 상태.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import { useState } from 'react';

import { EmptyContent } from '@/src/components/empty-content';
import { Label } from '@/src/components/label';
import { SegmentPill } from '@/src/components/segment-pill';
import { Typo } from '@/src/components/typo';
import { PerformanceDetailSectionCard } from '@/src/sections/performance-detail/components/performance-detail-section-card';
import type {
  CastGridCell,
  CastGridModel,
} from '@/src/sections/performance-cast/utils/cast-grid';
import { MSG_D14 } from '@/src/shared/messages/d14';

interface CastGridCardProps {
  grid: CastGridModel & { hasShows: boolean; hasRoles: boolean };
  onEditCell: (showId: string, roleId: string) => void;
  onClearCell: (showId: string, roleId: string) => void;
}

function CellContent({
  cell,
  onEdit,
  onClear,
}: {
  cell: CastGridCell;
  onEdit: () => void;
  onClear: () => void;
}) {
  return (
    <div className='flex flex-col items-start gap-1'>
      <ButtonBase
        onClick={onEdit}
        aria-label={MSG_D14.GRID_EDIT_ARIA(cell.roleLabel, cell.showLabel)}
        sx={{
          minHeight: 44,
          px: 1,
          borderRadius: 1,
          justifyContent: 'flex-start',
          textAlign: 'left',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <span className='flex flex-col'>
          {cell.isOverride ? (
            <Typo.Badge.Bold>{cell.names}</Typo.Badge.Bold>
          ) : (
            <>
              <Typo.Caption.Regular color='text.disabled'>
                {MSG_D14.GRID_DEFAULT}
              </Typo.Caption.Regular>
              <Typo.Badge.Regular color='text.secondary'>
                {cell.names}
              </Typo.Badge.Regular>
            </>
          )}
        </span>
      </ButtonBase>
      <div className='flex flex-wrap items-center gap-1'>
        {cell.reason ? <Label tone='warning'>{cell.reason}</Label> : null}
        {cell.isOverride ? (
          <Button
            size='small'
            color='inherit'
            onClick={onClear}
            aria-label={MSG_D14.GRID_CLEAR_ARIA(cell.roleLabel, cell.showLabel)}
          >
            {MSG_D14.GRID_CLEAR}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function CastGridCard({
  grid,
  onEditCell,
  onClearCell,
}: CastGridCardProps) {
  const [pickedShowId, setPickedShowId] = useState<string | null>(null);
  const showId = pickedShowId ?? grid.shows[0]?.id ?? '';

  const body = !grid.hasShows ? (
    <EmptyContent message={MSG_D14.GRID_NO_SHOWS} />
  ) : !grid.hasRoles ? (
    <EmptyContent message={MSG_D14.ROLES_EMPTY} />
  ) : (
    <>
      <Box sx={{ display: { xs: 'none', lg: 'block' }, overflowX: 'auto' }}>
        <Box
          component='table'
          sx={{ borderCollapse: 'collapse', minWidth: '100%' }}
        >
          <thead>
            <tr>
              <Box component='th' scope='col' sx={{ p: 1, textAlign: 'left' }}>
                <Typo.Badge.Medium>
                  {MSG_D14.GRID_ROLE_HEADER}
                </Typo.Badge.Medium>
              </Box>
              {grid.shows.map((show) => (
                <Box
                  component='th'
                  scope='col'
                  key={show.id}
                  sx={{ p: 1, textAlign: 'left', whiteSpace: 'nowrap' }}
                >
                  <Typo.Badge.Medium>{show.label}</Typo.Badge.Medium>
                </Box>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row) => (
              <Box
                component='tr'
                key={row.roleId}
                sx={{ borderTop: 1, borderColor: 'divider' }}
              >
                <Box
                  component='th'
                  scope='row'
                  sx={{ p: 1, textAlign: 'left' }}
                >
                  <Typo.Badge.Bold>{row.roleLabel}</Typo.Badge.Bold>
                </Box>
                {row.cells.map((cell) => (
                  <Box
                    component='td'
                    key={cell.key}
                    sx={{ p: 1, verticalAlign: 'top' }}
                  >
                    <CellContent
                      cell={cell}
                      onEdit={() => onEditCell(cell.showId, cell.roleId)}
                      onClear={() => onClearCell(cell.showId, cell.roleId)}
                    />
                  </Box>
                ))}
              </Box>
            ))}
          </tbody>
        </Box>
      </Box>
      <Box
        sx={{
          display: { xs: 'flex', lg: 'none' },
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box sx={{ overflowX: 'auto' }}>
          <SegmentPill
            ariaLabel={MSG_D14.GRID_SHOW_PICK}
            options={grid.shows.map((show) => ({
              value: show.id,
              label: show.label,
            }))}
            value={showId}
            onChange={setPickedShowId}
          />
        </Box>
        <ul className='m-0 flex list-none flex-col gap-2 p-0'>
          {grid.rows.flatMap((row) =>
            row.cells
              .filter((cell) => cell.showId === showId)
              .map((cell) => (
                <Box
                  component='li'
                  key={cell.key}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Typo.Badge.Bold>{row.roleLabel}</Typo.Badge.Bold>
                  <CellContent
                    cell={cell}
                    onEdit={() => onEditCell(cell.showId, cell.roleId)}
                    onClear={() => onClearCell(cell.showId, cell.roleId)}
                  />
                </Box>
              ))
          )}
        </ul>
      </Box>
    </>
  );

  return (
    <PerformanceDetailSectionCard title={MSG_D14.GRID_TITLE}>
      {body}
    </PerformanceDetailSectionCard>
  );
}
