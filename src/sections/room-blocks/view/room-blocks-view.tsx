'use client';

// ----------------------------------------------------------------------
// (U46) 연습실 '시간 막기' 탭 View — 머리(제목·부제·'시간 막기') → 탭 → 표(제목·반복·시간·기간·해제한 날·동작) / xs 카드.
// 로딩 · 오류 "다시 시도" · 빈 상태. + 추가·수정 · 겹침 경고 · 삭제 확인 · 이 날만 해제. props 만으로 렌더.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';

import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/src/components/data-table';
import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { Iconify } from '@/src/components/iconify';
import { PageContainer } from '@/src/components/page-container';
import { PageHead } from '@/src/components/page-head';
import { SectionStack } from '@/src/components/section-stack';
import { TableSkeleton } from '@/src/components/table-skeleton';
import { Typo } from '@/src/components/typo';
import { RoomBlockConflictDialog } from '@/src/sections/room-blocks/components/room-block-conflict-dialog';
import { RoomBlockDialog } from '@/src/sections/room-blocks/components/room-block-dialog';
import { RoomBlockSkipDialog } from '@/src/sections/room-blocks/components/room-block-skip-dialog';
import type { RoomBlockRow } from '@/src/sections/room-blocks/utils/room-block-form';
import type { RoomBlocksViewModel } from '@/src/sections/room-blocks/view/use-room-blocks-view-model';
import { RoomTabs } from '@/src/sections/room-reservations/components/room-tabs';
import { MSG_BLOCKS } from '@/src/shared/messages/room-blocks';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_ROOMS } from '@/src/shared/messages/room-reservations';

interface RoomBlocksViewProps {
  vm: RoomBlocksViewModel;
}

export function RoomBlocksView({ vm }: RoomBlocksViewProps) {
  const actions = (row: RoomBlockRow) => (
    <div className='flex flex-wrap items-center justify-end gap-1'>
      <Button
        size='small'
        variant='outlined'
        color='inherit'
        aria-label={MSG_BLOCKS.SKIP_ARIA(row.title)}
        onClick={() => vm.onSkip(row.id)}
      >
        {MSG_BLOCKS.SKIP}
      </Button>
      <Button
        size='small'
        variant='outlined'
        aria-label={MSG_BLOCKS.EDIT_ARIA(row.title)}
        onClick={() => vm.onEdit(row.id)}
      >
        {MSG_BLOCKS.EDIT}
      </Button>
      <Button
        size='small'
        color='error'
        aria-label={MSG_BLOCKS.DELETE_ARIA(row.title)}
        onClick={() => vm.onDelete(row.id)}
      >
        {MSG_BLOCKS.DELETE}
      </Button>
    </div>
  );
  const text = (value: string) => (
    <Typo.Body.Regular>{value}</Typo.Body.Regular>
  );
  const columns: DataTableColumn<RoomBlockRow>[] = [
    {
      key: 'title',
      header: MSG_BLOCKS.COL_TITLE,
      render: (r) => <Typo.Body.Semibold>{r.title}</Typo.Body.Semibold>,
    },
    {
      key: 'repeat',
      header: MSG_BLOCKS.COL_REPEAT,
      render: (r) => text(r.repeatText),
    },
    {
      key: 'time',
      header: MSG_BLOCKS.COL_TIME,
      render: (r) => text(r.timeText),
    },
    {
      key: 'period',
      header: MSG_BLOCKS.COL_PERIOD,
      render: (r) => text(r.periodText),
    },
    {
      key: 'skips',
      header: MSG_BLOCKS.COL_SKIPS,
      render: (r) => (
        <Typo.Caption.Regular color='text.secondary'>
          {r.skipText}
        </Typo.Caption.Regular>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>{MSG_BLOCKS.COL_ACTIONS}</span>,
      isCompact: true,
      render: actions,
    },
  ];
  const renderCard = (r: RoomBlockRow) => (
    <>
      <Typo.Body.Semibold>{r.title}</Typo.Body.Semibold>
      <Typo.Badge.Regular>
        {r.repeatText} · {r.timeText}
      </Typo.Badge.Regular>
      <Typo.Caption.Regular color='text.secondary'>
        {r.periodText} · {MSG_BLOCKS.COL_SKIPS} {r.skipText}
      </Typo.Caption.Regular>
      {actions(r)}
    </>
  );

  const body =
    vm.status === 'loading' ? (
      <TableSkeleton />
    ) : vm.status === 'error' ? (
      <ErrorRetry message={vm.errorMessage ?? ''} onRetry={vm.onRetry} />
    ) : vm.rows.length === 0 ? (
      <EmptyContent
        message={MSG_BLOCKS.EMPTY}
        icon='solar:calendar-mark-linear'
      />
    ) : (
      <DataTable
        ariaLabel={MSG_BLOCKS.TABLE_ARIA}
        columns={columns}
        rows={vm.rows}
        getRowKey={(r) => r.id}
        renderCard={renderCard}
        cardBelow='lg'
      />
    );

  return (
    <PageContainer>
      <SectionStack>
        <PageHead
          title={MSG_ROOMS.TITLE}
          subtitle={MSG_BLOCKS.SUBTITLE}
          actions={
            <Button
              variant='contained'
              onClick={vm.onAdd}
              startIcon={<Iconify icon='solar:add-circle-linear' />}
            >
              {MSG_BLOCKS.ADD}
            </Button>
          }
        />
        <RoomTabs current='blocks' />
        <Card>{body}</Card>
      </SectionStack>
      <RoomBlockDialog dialog={vm.dialog} />
      <RoomBlockConflictDialog conflict={vm.conflict} />
      <RoomBlockSkipDialog skip={vm.skipDialog} />
      <ConfirmDialog
        open={vm.deleteConfirm.isOpen}
        message={MSG_BLOCKS.DELETE_CONFIRM}
        description={vm.deleteConfirm.description}
        confirmLabel={MSG_COMMON.DELETE}
        isLoading={vm.deleteConfirm.isLoading}
        onConfirm={vm.deleteConfirm.onConfirm}
        onCancel={vm.deleteConfirm.onCancel}
      />
    </PageContainer>
  );
}
