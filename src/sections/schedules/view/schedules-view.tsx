'use client';

// ----------------------------------------------------------------------
// SCR-D08 일정 관리 View — props 만으로 그린다. 본문(월·주·아젠다·목록과 그 상태)은 Container 가 골라 body 로 준다.
// 순서(design SCR-D08 U23 보강): 머리 + "일정 추가" → 도구 줄(오늘 · ‹ › · 범위 제목 · 보기 전환) → 타입 필터 pill →
// 카드(본문) → (목록) 페이지네이션. 보기 전환은 내용 크로스페이드(designer §14.4).
// 상세 팝오버/시트 · 더보기 팝오버 · 추가/수정 · 삭제 확인 · 일정 취소 · 취소 해제 확인.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import { keyframes } from '@mui/material/styles';
import type { ReactNode } from 'react';

import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { Iconify } from '@/src/components/iconify';
import { PageContainer } from '@/src/components/page-container';
import { PageHead } from '@/src/components/page-head';
import { Pagination } from '@/src/components/pagination';
import { SectionStack } from '@/src/components/section-stack';
import { SegmentPill } from '@/src/components/segment-pill';
import { ScheduleCancelDialog } from '@/src/sections/schedules/components/schedule-cancel-dialog';
import { ScheduleDetailPopover } from '@/src/sections/schedules/components/schedule-detail-popover';
import { ScheduleFormDialog } from '@/src/sections/schedules/components/schedule-form-dialog';
import { ScheduleMorePopover } from '@/src/sections/schedules/components/schedule-more-popover';
import { ScheduleToolbar } from '@/src/sections/schedules/components/schedule-toolbar';
import { RoomReservationDetailDialog } from '@/src/sections/schedules/components/room-reservation-detail-dialog';
import { ScheduleRoomList } from '@/src/sections/schedules/components/schedule-room-list';
import type { SchedulesViewModel } from '@/src/sections/schedules/view/use-schedules-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D08 } from '@/src/shared/messages/d08';
import { MOTION } from '@/src/theme/motion';

interface SchedulesViewProps {
  vm: SchedulesViewModel;
  body: ReactNode;
}

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

export function SchedulesView({ vm, body }: SchedulesViewProps) {
  const { calendar, form, cancel } = vm;
  return (
    <PageContainer>
      <SectionStack>
        <PageHead
          title={MSG_D08.TITLE}
          subtitle={MSG_D08.SUBTITLE}
          actions={
            <Button
              variant='contained'
              startIcon={<Iconify icon='solar:add-circle-linear' />}
              onClick={vm.onOpenAdd}
            >
              {MSG_D08.ADD}
            </Button>
          }
        />
        <div className='flex flex-col gap-3'>
          <ScheduleToolbar
            view={calendar.view}
            viewOptions={vm.viewOptions}
            rangeTitle={calendar.rangeTitle}
            onToday={calendar.onToday}
            onPrev={calendar.onPrev}
            onNext={calendar.onNext}
            onViewChange={vm.onViewChange}
            showRooms={vm.showRooms}
            onToggleRooms={vm.onToggleRooms}
          />
          <SegmentPill
            ariaLabel={MSG_D08.COL_TYPE}
            options={vm.filterOptions}
            value={vm.typeFilter}
            onChange={vm.onFilterChange}
          />
        </div>
        <Box
          key={calendar.view}
          className='flex flex-col gap-4'
          sx={{
            animation: `${fadeIn} ${MOTION.duration.short}ms ${MOTION.easing.standard}`,
          }}
        >
          <Card sx={{ overflow: 'hidden' }}>{body}</Card>
          {vm.roomListEvents ? (
            <ScheduleRoomList
              events={vm.roomListEvents}
              onOpenEvent={vm.onOpenDetail}
            />
          ) : null}
          {calendar.view === 'list' ? (
            <Pagination
              page={vm.page}
              totalPages={vm.totalPages}
              onChange={vm.onPageChange}
            />
          ) : null}
        </Box>
      </SectionStack>
      <ScheduleMorePopover
        cell={vm.moreCell}
        anchor={vm.moreAnchor}
        onOpenEvent={vm.onOpenDetail}
        onClose={vm.onCloseMore}
      />
      <ScheduleDetailPopover
        detail={vm.detail}
        anchor={vm.detailAnchor}
        isSheet={vm.isXs}
        handlers={vm.rowHandlers}
        onClose={vm.onCloseDetail}
      />
      <ScheduleFormDialog
        open={form.isOpen}
        title={form.title}
        submitLabel={form.submitLabel}
        form={form.form}
        errors={form.errors}
        submitError={form.submitError}
        isSubmitting={form.isSubmitting}
        typeOptions={vm.typeOptions}
        performanceOptions={vm.performanceOptions}
        classOptions={form.classOptions}
        onFieldChange={form.onFieldChange}
        onSubmit={form.onSubmit}
        onClose={form.onClose}
      />
      <ConfirmDialog
        open={vm.isDeleteOpen}
        message={MSG_D08.CONFIRM_DELETE}
        confirmLabel={MSG_COMMON.DELETE}
        isLoading={vm.isDeleting}
        onConfirm={vm.onConfirmDelete}
        onCancel={vm.onCancelDelete}
      />
      <ScheduleCancelDialog state={cancel} />
      <RoomReservationDetailDialog
        event={vm.roomDetail}
        isDeleting={vm.isRoomDeleting}
        onDelete={vm.onRoomDelete}
        onClose={vm.onCloseRoomDetail}
      />
      <ConfirmDialog
        open={vm.isRoomDeleteOpen}
        message={
          vm.isRoomBlock
            ? MSG_D08.BLOCK_SKIP_CONFIRM
            : MSG_D08.ROOM_DELETE_CONFIRM
        }
        confirmLabel={vm.isRoomBlock ? MSG_D08.BLOCK_SKIP : MSG_D08.ROOM_DELETE}
        isLoading={vm.isRoomDeleting}
        onConfirm={vm.onConfirmRoomDelete}
        onCancel={vm.onCancelRoomDelete}
      />
      <ConfirmDialog
        open={cancel.isRestoreOpen}
        message={MSG_D08.CONFIRM_RESTORE}
        confirmLabel={MSG_D08.RESTORE}
        confirmColor='primary'
        isLoading={cancel.isRestoring}
        onConfirm={cancel.onConfirmRestore}
        onCancel={cancel.onCancelRestore}
      />
    </PageContainer>
  );
}
