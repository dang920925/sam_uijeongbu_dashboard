'use client';

// ----------------------------------------------------------------------
// "회차 관리" 카드(design §6 SCR-D11 콘텐츠 3·4) — lg 표 / md·xs 카드(D08 규칙: 열 많은 표는 md 도 카드).
// 표: 날짜·시각·장소·좌석 예매/확정/남은(+총 n석)·오픈 시각·예매 상태(+빈 칸)·예매 중지 스위치·수정/삭제.
// 빈 회차 "등록된 회차가 없습니다", 바닥 안내(일정 자동 연동 없음). props 만으로 렌더.
// (U35) 좌석 지정이 켜진 공연은 행 동작에 "좌석 배치"(의자 아이콘).
// (U48) 공연에 팀이 있으면 '출연 팀' 열(선택 칸 — 팀 미정 · A팀 …, 바꾸면 바로 저장). 카드도 같은 칸.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { DataTable, type DataTableColumn } from '@/src/components/data-table';
import { EmptyContent } from '@/src/components/empty-content';
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { ShowsSectionCard } from '@/src/sections/performance-shows/components/shows-section-card';
import type { ShowRowDisplay } from '@/src/sections/performance-shows/utils/show-row';
import { MSG_D11 } from '@/src/shared/messages/d11';
import { MSG_SEAT } from '@/src/shared/messages/seat';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface ShowsCardProps {
  rows: ShowRowDisplay[];
  togglingId: string | null;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStop: (id: string, isStopped: boolean) => void;
  /** U35 — 좌석 지정 공연일 때만 */
  onSeatLayout?: (id: string) => void;
  /** (U48) 이 공연의 팀(없으면 열 없음) */
  teamOptions: { value: string; label: string }[];
  savingTeamId: string | null;
  onTeamChange: (id: string, teamAccountId: string) => void;
}

const ICON_BUTTON_SX = { width: LAYOUT.controlSm, height: LAYOUT.controlSm };

export function ShowsCard({
  rows,
  togglingId,
  onAdd,
  onEdit,
  onDelete,
  onToggleStop,
  onSeatLayout,
  teamOptions,
  savingTeamId,
  onTeamChange,
}: ShowsCardProps) {
  const titleId = useId();
  const hasTeams = teamOptions.length > 0;

  const teamSelect = (row: ShowRowDisplay) => (
    <TextField
      select
      size='small'
      value={row.teamAccountId}
      disabled={savingTeamId === row.id}
      onChange={(event) => onTeamChange(row.id, event.target.value)}
      sx={{ minWidth: 120 }}
      slotProps={{
        select: {
          displayEmpty: true,
          SelectDisplayProps: {
            'aria-label': MSG_D11.TEAM_ARIA(row.titleText),
          } as object,
        },
      }}
    >
      <MenuItem value=''>{MSG_D11.TEAM_NONE}</MenuItem>
      {teamOptions.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );

  const actions = (row: ShowRowDisplay) => (
    <div className='flex justify-end gap-1'>
      {onSeatLayout ? (
        <IconButton
          aria-label={MSG_SEAT.LAYOUT_BUTTON_ARIA(row.titleText)}
          title={MSG_SEAT.LAYOUT_BUTTON}
          onClick={() => onSeatLayout(row.id)}
          sx={{ ...ICON_BUTTON_SX, color: 'primary.main' }}
        >
          <Iconify icon='solar:armchair-linear' />
        </IconButton>
      ) : null}
      <IconButton
        aria-label={`${MSG_D11.EDIT_ARIA} ${row.titleText}`}
        onClick={() => onEdit(row.id)}
        sx={{ ...ICON_BUTTON_SX, color: 'text.secondary' }}
      >
        <Iconify icon='solar:pen-linear' />
      </IconButton>
      <IconButton
        aria-label={`${MSG_D11.DELETE_ARIA} ${row.titleText}`}
        onClick={() => onDelete(row.id)}
        sx={{ ...ICON_BUTTON_SX, color: 'error.main' }}
      >
        <Iconify icon='solar:trash-bin-trash-linear' />
      </IconButton>
    </div>
  );

  const stopSwitch = (row: ShowRowDisplay) => (
    <Switch
      checked={row.isStopped}
      disabled={togglingId !== null}
      onChange={(_, checked) => onToggleStop(row.id, checked)}
      slotProps={{
        input: {
          'aria-label': `${MSG_D11.STOP_BOOKING} ${row.titleText}`,
        },
      }}
    />
  );

  const secondary = (text: string) => (
    <Typo.Badge.Regular color='text.secondary'>{text}</Typo.Badge.Regular>
  );

  const stateCell = (row: ShowRowDisplay) => (
    <div className='flex flex-col items-start gap-1'>
      <Label tone={row.stateTone} variant={row.stateVariant}>
        {row.stateLabel}
      </Label>
      {row.missingText ? (
        <Typo.Caption.Regular color='text.secondary'>
          {row.missingText}
        </Typo.Caption.Regular>
      ) : null}
    </div>
  );

  const columns: DataTableColumn<ShowRowDisplay>[] = [
    {
      key: 'date',
      header: MSG_D11.COL_DATE,
      render: (row) => <Typo.Body.Semibold>{row.dateText}</Typo.Body.Semibold>,
    },
    {
      key: 'time',
      header: MSG_D11.COL_TIME,
      render: (row) => <Typo.Badge.Regular>{row.timeText}</Typo.Badge.Regular>,
    },
    {
      key: 'venue',
      header: MSG_D11.COL_VENUE,
      render: (row) => secondary(row.venueText),
    },
    {
      key: 'seats',
      header: MSG_D11.COL_SEATS,
      render: (row) => (
        <div className='flex flex-col'>
          <Typo.Badge.Regular>{row.seatsCountsText}</Typo.Badge.Regular>
          <Typo.Caption.Regular color='text.secondary'>
            {row.seatsTotalText}
          </Typo.Caption.Regular>
        </div>
      ),
    },
    {
      key: 'open',
      header: MSG_D11.COL_OPEN,
      render: (row) => secondary(row.openText),
    },
    ...(hasTeams
      ? [{ key: 'team', header: MSG_D11.COL_TEAM, render: teamSelect }]
      : []),
    { key: 'state', header: MSG_D11.COL_STATE, render: stateCell },
    { key: 'stop', header: MSG_D11.COL_STOP, render: stopSwitch },
    {
      key: 'actions',
      header: <span className='sr-only'>{MSG_D11.COL_ACTIONS}</span>,
      isCompact: true,
      render: actions,
    },
  ];

  const renderCard = (row: ShowRowDisplay) => (
    <>
      <div className='flex items-start justify-between gap-2'>
        <Typo.Body.Semibold>{row.titleText}</Typo.Body.Semibold>
        <Label tone={row.stateTone} variant={row.stateVariant}>
          {row.stateLabel}
        </Label>
      </div>
      <div className='flex flex-wrap gap-x-3 gap-y-1'>
        {row.cardMeta.map((text) => (
          <Typo.Badge.Regular key={text} color='text.secondary'>
            {text}
          </Typo.Badge.Regular>
        ))}
      </div>
      <div className='flex flex-wrap gap-x-3 gap-y-1'>
        {row.cardSeats.map((text) => (
          <Typo.Badge.Regular key={text} color='text.secondary'>
            {text}
          </Typo.Badge.Regular>
        ))}
      </div>
      {row.missingText ? (
        <Typo.Caption.Regular color='text.secondary'>
          {row.missingText}
        </Typo.Caption.Regular>
      ) : null}
      {hasTeams ? (
        <div className='flex items-center gap-3'>
          <Typo.Badge.Medium>{MSG_D11.COL_TEAM}</Typo.Badge.Medium>
          {teamSelect(row)}
        </div>
      ) : null}
      <div className='flex items-center justify-between gap-2'>
        <FormControlLabel
          sx={{ m: 0, minHeight: LAYOUT.touch, gap: 2 }}
          control={
            <Switch
              checked={row.isStopped}
              disabled={togglingId !== null}
              onChange={(_, checked) => onToggleStop(row.id, checked)}
              slotProps={{
                input: {
                  'aria-label': `${MSG_D11.STOP_BOOKING} ${row.titleText}`,
                },
              }}
            />
          }
          label={<Typo.Badge.Medium>{MSG_D11.STOP_BOOKING}</Typo.Badge.Medium>}
        />
        {actions(row)}
      </div>
    </>
  );

  return (
    <ShowsSectionCard
      title={MSG_D11.SHOWS_TITLE}
      titleId={titleId}
      isFlush
      action={
        <Button
          variant='contained'
          size='small'
          onClick={onAdd}
          startIcon={<Iconify icon='solar:calendar-add-linear' />}
        >
          {MSG_D11.SHOW_ADD}
        </Button>
      }
      footer={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
            px: { xs: 4, md: 6 },
            py: { xs: 3, md: 4 },
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Iconify
            icon='solar:info-circle-linear'
            sx={{ color: 'text.secondary' }}
          />
          <Typo.Caption.Regular color='text.secondary'>
            {MSG_D11.SHOWS_NOTE}
          </Typo.Caption.Regular>
        </Box>
      }
    >
      {rows.length === 0 ? (
        <EmptyContent
          message={MSG_D11.SHOWS_EMPTY}
          icon='solar:calendar-add-linear'
        />
      ) : (
        <DataTable
          ariaLabel={MSG_D11.SHOWS_TABLE_ARIA}
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          renderCard={renderCard}
          cardBelow='lg'
        />
      )}
    </ShowsSectionCard>
  );
}
