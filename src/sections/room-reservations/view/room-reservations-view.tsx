'use client';

// ----------------------------------------------------------------------
// U34 관리자 연습실 예약 목록 View — 머리(제목·부제) → 주 이동 줄 → 표(날짜·시간·팀·작품·참석자(U45)·메모·삭제) / xs 카드.
// 로딩 스켈레톤 · 오류 "다시 시도" · 빈 상태. props 만으로 렌더.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';

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
import type { RoomRowDisplay } from '@/src/sections/room-reservations/utils/room-week';
import type { RoomReservationsViewModel } from '@/src/sections/room-reservations/view/use-room-reservations-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_ROOMS } from '@/src/shared/messages/room-reservations';

interface RoomReservationsViewProps {
  vm: RoomReservationsViewModel;
}

export function RoomReservationsView({ vm }: RoomReservationsViewProps) {
  const deleteButton = (row: RoomRowDisplay) => (
    <IconButton
      aria-label={MSG_ROOMS.DELETE_ARIA(
        row.teamName,
        `${row.dateText} ${row.timeText}`
      )}
      onClick={() => vm.onDelete(row.id)}
      sx={{ color: 'error.main' }}
    >
      <Iconify icon='solar:trash-bin-trash-linear' />
    </IconButton>
  );
  const columns: DataTableColumn<RoomRowDisplay>[] = [
    {
      key: 'date',
      header: MSG_ROOMS.COL_DATE,
      render: (r) => <Typo.Body.Semibold>{r.dateText}</Typo.Body.Semibold>,
    },
    {
      key: 'time',
      header: MSG_ROOMS.COL_TIME,
      render: (r) => <Typo.Body.Regular>{r.timeText}</Typo.Body.Regular>,
    },
    {
      key: 'team',
      header: MSG_ROOMS.COL_TEAM,
      render: (r) => <Typo.Body.Regular>{r.teamName}</Typo.Body.Regular>,
    },
    {
      key: 'performance',
      header: MSG_ROOMS.COL_PERFORMANCE,
      render: (r) => (
        <Typo.Body.Regular>{r.performanceTitle}</Typo.Body.Regular>
      ),
    },
    {
      key: 'attendees',
      header: MSG_ROOMS.COL_ATTENDEES,
      render: (r) => (
        <Typo.Caption.Regular data-testid='room-attendees'>
          {r.attendeesText}
        </Typo.Caption.Regular>
      ),
    },
    {
      key: 'memo',
      header: MSG_ROOMS.COL_MEMO,
      render: (r) => (
        <Typo.Caption.Regular color='text.secondary'>
          {r.memo}
        </Typo.Caption.Regular>
      ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>{MSG_ROOMS.COL_ACTIONS}</span>,
      isCompact: true,
      render: deleteButton,
    },
  ];
  const renderCard = (r: RoomRowDisplay) => (
    <>
      <div className='flex items-center justify-between gap-2'>
        <Typo.Body.Semibold>
          {r.dateText} {r.timeText}
        </Typo.Body.Semibold>
        {deleteButton(r)}
      </div>
      <Typo.Badge.Regular>
        {r.teamName} · {r.performanceTitle}
      </Typo.Badge.Regular>
      <Typo.Caption.Regular>
        {MSG_ROOMS.COL_ATTENDEES} {r.attendeesText}
      </Typo.Caption.Regular>
      <Typo.Caption.Regular color='text.secondary'>
        {r.memo}
      </Typo.Caption.Regular>
    </>
  );

  const body =
    vm.status === 'loading' ? (
      <TableSkeleton />
    ) : vm.status === 'error' ? (
      <ErrorRetry message={vm.errorMessage ?? ''} onRetry={vm.onRetry} />
    ) : vm.rows.length === 0 ? (
      <EmptyContent
        message={MSG_ROOMS.EMPTY}
        icon='solar:calendar-mark-linear'
      />
    ) : (
      <DataTable
        ariaLabel={MSG_ROOMS.TABLE_ARIA}
        columns={columns}
        rows={vm.rows}
        getRowKey={(r) => r.id}
        renderCard={renderCard}
        cardBelow='md'
      />
    );

  return (
    <PageContainer>
      <SectionStack>
        <PageHead title={MSG_ROOMS.TITLE} subtitle={MSG_ROOMS.SUBTITLE} />
        <div className='flex flex-wrap items-center gap-2'>
          <IconButton aria-label={MSG_ROOMS.WEEK_PREV} onClick={vm.onPrev}>
            <Iconify icon='solar:alt-arrow-left-linear' />
          </IconButton>
          <Typo.Title.Bold component='h2' data-testid='room-week-title'>
            {vm.weekTitle}
          </Typo.Title.Bold>
          <IconButton aria-label={MSG_ROOMS.WEEK_NEXT} onClick={vm.onNext}>
            <Iconify icon='solar:alt-arrow-right-linear' />
          </IconButton>
          <Button variant='outlined' size='small' onClick={vm.onToday}>
            {MSG_ROOMS.WEEK_TODAY}
          </Button>
        </div>
        <Card>{body}</Card>
      </SectionStack>
      <ConfirmDialog
        open={vm.deleteConfirm.isOpen}
        message={MSG_ROOMS.DELETE_CONFIRM}
        description={vm.deleteConfirm.description}
        confirmLabel={MSG_COMMON.DELETE}
        isLoading={vm.deleteConfirm.isLoading}
        onConfirm={vm.deleteConfirm.onConfirm}
        onCancel={vm.deleteConfirm.onCancel}
      />
    </PageContainer>
  );
}
