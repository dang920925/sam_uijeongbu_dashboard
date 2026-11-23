'use client';

// ----------------------------------------------------------------------
// U34 '팀 계정' 카드(design §13 SCR-D04) — 머리(제목·부제 + "전체 복사"·"팀 추가") → 접두어(수정·저장) → 표 → 안내.
// lg 표: 팀 · 아이디 · 비밀번호(가림 + 보기) · 소속 배우(U45) · 상태 Label · 사용 스위치 · 동작(복사·재발급) / md·xs 카드.
// 접두어가 없는(기존) 작품은 빈 상태 + "팀 계정 만들기". props 만으로 렌더.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { DataTable, type DataTableColumn } from '@/src/components/data-table';
import { EmptyContent } from '@/src/components/empty-content';
import { FormField } from '@/src/components/form-field';
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { ShowsSectionCard } from '@/src/sections/performance-shows/components/shows-section-card';
import type { TeamRowDisplay } from '@/src/sections/performance-teams/utils/team-row';
import type { PerformanceTeamsViewModel } from '@/src/sections/performance-teams/view/use-performance-teams-view-model';
import { MSG_TEAMS } from '@/src/shared/messages/team-accounts';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface TeamAccountsCardProps {
  card: PerformanceTeamsViewModel['card'];
}

const ICON_BUTTON_SX = {
  width: LAYOUT.controlSm,
  height: LAYOUT.controlSm,
  color: 'text.secondary',
  '&.Mui-disabled': { opacity: 0.5 },
};

export function TeamAccountsCard({ card }: TeamAccountsCardProps) {
  const titleId = useId();
  const prefixId = useId();

  const password = (row: TeamRowDisplay) => (
    <div className='flex items-center gap-1'>
      <Typo.Body.Regular
        data-testid='team-password'
        sx={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}
      >
        {row.passwordText}
      </Typo.Body.Regular>
      {row.canCopy ? (
        <IconButton
          aria-label={
            row.isRevealed
              ? MSG_TEAMS.HIDE_PASSWORD(row.label)
              : MSG_TEAMS.SHOW_PASSWORD(row.label)
          }
          onClick={() => card.onToggleReveal(row.id)}
          sx={ICON_BUTTON_SX}
        >
          <Iconify
            icon={
              row.isRevealed ? 'solar:eye-closed-linear' : 'solar:eye-linear'
            }
          />
        </IconButton>
      ) : null}
    </div>
  );

  const activeSwitch = (row: TeamRowDisplay) => (
    <Switch
      checked={row.isActive}
      disabled={card.isBusy}
      onChange={(_, checked) => card.onToggleActive(row.id, checked)}
      slotProps={{ input: { 'aria-label': MSG_TEAMS.ACTIVE_ARIA(row.label) } }}
    />
  );

  const actions = (row: TeamRowDisplay) => (
    <div className='flex items-center justify-end gap-1'>
      <IconButton
        aria-label={MSG_TEAMS.COPY_ROW(row.label)}
        disabled={!row.canCopy}
        onClick={() => card.onCopyRow(row.id)}
        sx={ICON_BUTTON_SX}
      >
        <Iconify icon='solar:copy-linear' />
      </IconButton>
      <Button
        size='small'
        variant='outlined'
        disabled={card.isBusy}
        aria-label={MSG_TEAMS.REISSUE_ARIA(row.label)}
        onClick={() => card.onReissue(row.id)}
        startIcon={<Iconify icon='solar:refresh-linear' />}
      >
        {MSG_TEAMS.REISSUE}
      </Button>
    </div>
  );

  const columns: DataTableColumn<TeamRowDisplay>[] = [
    {
      key: 'label',
      header: MSG_TEAMS.COL_LABEL,
      isCompact: true,
      render: (row) => <Typo.Body.Semibold>{row.label}</Typo.Body.Semibold>,
    },
    {
      key: 'username',
      header: MSG_TEAMS.COL_USERNAME,
      render: (row) => <Typo.Body.Regular>{row.username}</Typo.Body.Regular>,
    },
    { key: 'password', header: MSG_TEAMS.COL_PASSWORD, render: password },
    {
      key: 'members',
      header: MSG_TEAMS.COL_MEMBERS,
      render: (row) => (
        <Typo.Caption.Regular data-testid='team-members'>
          {row.membersText}
        </Typo.Caption.Regular>
      ),
    },
    {
      key: 'status',
      header: <span className='sr-only'>{MSG_TEAMS.ACTIVE}</span>,
      render: (row) => <Label tone={row.statusTone}>{row.statusText}</Label>,
    },
    { key: 'active', header: MSG_TEAMS.COL_ACTIVE, render: activeSwitch },
    {
      key: 'actions',
      header: <span className='sr-only'>{MSG_TEAMS.COL_ACTIONS}</span>,
      isCompact: true,
      render: actions,
    },
  ];

  const renderCard = (row: TeamRowDisplay) => (
    <>
      <div className='flex items-center justify-between gap-2'>
        <Typo.Body.Semibold>
          {row.label} · {row.username}
        </Typo.Body.Semibold>
        <Label tone={row.statusTone}>{row.statusText}</Label>
      </div>
      {password(row)}
      <Typo.Caption.Regular>
        {MSG_TEAMS.COL_MEMBERS} {row.membersText}
      </Typo.Caption.Regular>
      <div className='flex items-center justify-between gap-2'>
        {activeSwitch(row)}
        {actions(row)}
      </div>
    </>
  );

  return (
    <ShowsSectionCard
      title={MSG_TEAMS.TITLE}
      subtitle={MSG_TEAMS.SUBTITLE}
      titleId={titleId}
      isFlush
      action={
        card.hasPrefix ? (
          <div className='flex flex-wrap justify-end gap-2'>
            <Button
              variant='outlined'
              size='small'
              onClick={card.onCopyAll}
              startIcon={<Iconify icon='solar:copy-linear' />}
            >
              {MSG_TEAMS.COPY_ALL}
            </Button>
            <Button
              variant='contained'
              size='small'
              disabled={card.isBusy}
              onClick={card.onAdd}
              startIcon={<Iconify icon='solar:add-circle-linear' />}
            >
              {MSG_TEAMS.ADD}
            </Button>
          </div>
        ) : null
      }
      footer={
        <div className='px-4 pb-4 md:px-6 md:pb-6'>
          <Typo.Caption.Regular color='text.secondary'>
            {MSG_TEAMS.NOTICE} {MSG_TEAMS.MEMBERS_HELP}
          </Typo.Caption.Regular>
        </div>
      }
    >
      {card.hasPrefix ? (
        <>
          <div className='flex flex-wrap items-start gap-2 px-4 pb-4 md:px-6'>
            <div className='min-w-0 flex-1'>
              <FormField
                label={MSG_TEAMS.PREFIX_LABEL}
                htmlFor={prefixId}
                helper={MSG_TEAMS.PREFIX_HELPER}
                error={card.prefixError}
              >
                <TextField
                  id={prefixId}
                  value={card.prefixValue}
                  onChange={(e) => card.onPrefixChange(e.target.value)}
                  slotProps={{ htmlInput: { maxLength: 20 } }}
                />
              </FormField>
            </div>
            <Button
              variant='outlined'
              disabled={
                !card.isPrefixDirty ||
                card.prefixError !== null ||
                card.isPrefixSaving
              }
              onClick={card.onPrefixSave}
              sx={{ mt: { xs: 0, sm: 4 } }}
            >
              {MSG_TEAMS.PREFIX_SAVE}
            </Button>
          </div>
          <DataTable
            ariaLabel={MSG_TEAMS.TABLE_ARIA}
            columns={columns}
            rows={card.rows}
            getRowKey={(row) => row.id}
            renderCard={renderCard}
            cardBelow='lg'
          />
        </>
      ) : (
        <div className='flex flex-col items-center gap-4 pb-6'>
          <EmptyContent
            message={MSG_TEAMS.EMPTY}
            icon='solar:users-group-rounded-linear'
          />
          <Button
            variant='contained'
            disabled={card.isBusy}
            onClick={card.onAdd}
            startIcon={<Iconify icon='solar:add-circle-linear' />}
          >
            {MSG_TEAMS.CREATE_FIRST}
          </Button>
        </div>
      )}
    </ShowsSectionCard>
  );
}
