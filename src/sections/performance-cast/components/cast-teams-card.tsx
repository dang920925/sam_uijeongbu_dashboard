'use client';

// ----------------------------------------------------------------------
// (U45) SCR-D14 '팀 구성' 카드 — 캐스트 배우(배역 순) × 팀(A·B…) 체크 표. 여러 팀 가능, 기본 미배정.
// md↑ 표(배우 · 팀 열마다 체크) / xs 카드(배우 이름 + 팀 체크 줄). 팀·배우가 없으면 안내. props 만으로 렌더.
// ----------------------------------------------------------------------
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Skeleton from '@mui/material/Skeleton';

import { DataTable, type DataTableColumn } from '@/src/components/data-table';
import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { Typo } from '@/src/components/typo';
import { PerformanceDetailSectionCard } from '@/src/sections/performance-detail/components/performance-detail-section-card';
import type { TeamRosterRow } from '@/src/sections/performance-cast/utils/team-roster-rows';
import type { TeamRosterSection } from '@/src/sections/performance-cast/view/use-team-roster-section';
import { MSG_D14 } from '@/src/shared/messages/d14';

interface CastTeamsCardProps {
  section: TeamRosterSection;
}

export function CastTeamsCard({ section }: CastTeamsCardProps) {
  const checkbox = (row: TeamRosterRow, index: number) => {
    const cell = row.cells[index];
    return (
      <Checkbox
        checked={cell.checked}
        onChange={(_, checked) =>
          section.onToggle(cell.teamAccountId, row.memberId, checked)
        }
        slotProps={{
          input: {
            'aria-label': MSG_D14.TEAMS_CHECK_ARIA(row.name, cell.label),
          },
        }}
      />
    );
  };

  const actor = (row: TeamRosterRow) => (
    <div className='flex flex-col'>
      <Typo.Body.Semibold>{row.name}</Typo.Body.Semibold>
      <Typo.Caption.Regular color='text.secondary'>
        {row.roleText}
      </Typo.Caption.Regular>
    </div>
  );

  const columns: DataTableColumn<TeamRosterRow>[] = [
    { key: 'actor', header: MSG_D14.TEAMS_COL_ACTOR, render: actor },
    ...section.teams.map((team, index) => ({
      key: team.teamAccountId,
      header: team.label,
      align: 'center' as const,
      isCompact: true,
      render: (row: TeamRosterRow) => checkbox(row, index),
    })),
  ];

  const renderCard = (row: TeamRosterRow) => (
    <>
      {actor(row)}
      <div className='flex flex-wrap gap-3'>
        {row.cells.map((cell, index) => (
          <FormControlLabel
            key={cell.teamAccountId}
            control={checkbox(row, index)}
            label={cell.label}
          />
        ))}
      </div>
    </>
  );

  const body =
    section.status === 'loading' ? (
      <div className='px-4 md:px-6'>
        <Skeleton variant='rounded' height={96} />
      </div>
    ) : section.status === 'error' ? (
      <ErrorRetry
        message={section.errorMessage ?? MSG_D14.TEAMS_ERROR}
        onRetry={section.onRetry}
      />
    ) : section.teams.length === 0 ? (
      <EmptyContent
        message={MSG_D14.TEAMS_NO_TEAMS}
        icon='solar:users-group-rounded-linear'
      />
    ) : section.rows.length === 0 ? (
      <EmptyContent
        message={MSG_D14.TEAMS_NO_ACTORS}
        icon='solar:users-group-rounded-linear'
      />
    ) : (
      <DataTable
        ariaLabel={MSG_D14.TEAMS_TABLE_ARIA}
        columns={columns}
        rows={section.rows}
        getRowKey={(row) => row.memberId}
        renderCard={renderCard}
      />
    );

  return (
    <PerformanceDetailSectionCard title={MSG_D14.TEAMS_TITLE} isFlush>
      <div className='flex flex-col gap-3' data-testid='cast-teams-card'>
        <div className='px-4 md:px-6'>
          <Typo.Badge.Regular color='text.secondary'>
            {MSG_D14.TEAMS_HELP}
          </Typo.Badge.Regular>
        </div>
        {body}
      </div>
    </PerformanceDetailSectionCard>
  );
}
