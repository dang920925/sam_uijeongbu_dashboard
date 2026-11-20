'use client';

// ----------------------------------------------------------------------
// SCR-D12 예매 관리 View — props(vm)만으로 그린다. 목록 칸(표·스켈레톤·빈·오류)과 공연 단계 상태(gate)는 Container 가 고른다.
// 순서(designer §13.7.3 2.1): 머리(기한 지난 예매 취소 · 예매 등록) → 공연 선택 → KPI 4 → 탭(예매·집계·초대 링크) → 탭 내용.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import type { ReactNode } from 'react';

import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { Iconify } from '@/src/components/iconify';
import { ManualReservationDialog } from '@/src/components/manual-reservation-dialog';
import { PageContainer } from '@/src/components/page-container';
import { PageHead } from '@/src/components/page-head';
import { Pagination } from '@/src/components/pagination';
import { ReservationDetailDrawer } from '@/src/components/reservation-detail-drawer';
import { SectionStack } from '@/src/components/section-stack';
import { Typo } from '@/src/components/typo';
import { InviteLinkTab } from '@/src/sections/reservations/components/invite-link-tab';
import { PerformanceSelect } from '@/src/sections/reservations/components/performance-select';
import { ReservationActionButtons } from '@/src/sections/reservations/components/reservation-action-buttons';
import { ReservationCancelDialog } from '@/src/sections/reservations/components/reservation-cancel-dialog';
import { ReservationFilterBar } from '@/src/sections/reservations/components/reservation-filter-bar';
import { ReservationIconActions } from '@/src/sections/reservations/components/reservation-icon-actions';
import { ReservationItemsDialog } from '@/src/sections/reservations/components/reservation-items-dialog';
import { ReservationKpiRow } from '@/src/sections/reservations/components/reservation-kpi-row';
import { ReservationMemoDialog } from '@/src/sections/reservations/components/reservation-memo-dialog';
import { ReservationSummaryTab } from '@/src/sections/reservations/components/reservation-summary-tab';
import { UndoSnackbar } from '@/src/sections/reservations/components/undo-snackbar';
import type {
  ReservationTab,
  ReservationsViewModel,
} from '@/src/sections/reservations/view/use-reservations-view-model';
import { MSG_D12 } from '@/src/shared/messages/d12';

interface ReservationsViewProps {
  vm: ReservationsViewModel;
  /** 공연 단계 상태(로딩·오류·공연 없음) — 있으면 머리 아래 이것만 */
  gate: ReactNode;
  list: ReactNode;
}

export function ReservationsView({ vm, gate, list }: ReservationsViewProps) {
  const { actions, invite } = vm;
  const handlers = {
    onConfirm: actions.onConfirm,
    onUnconfirm: actions.onUnconfirm,
    onRequestCancel: actions.onRequestCancel,
    onRestore: actions.onRestore,
    onRequestItems: actions.onRequestItems,
    onRequestMemo: actions.onRequestMemo,
    onOpenDetail: vm.onOpenDetail,
  };
  return (
    <PageContainer>
      <SectionStack>
        <PageHead
          title={MSG_D12.TITLE}
          subtitle={MSG_D12.SUBTITLE}
          actions={
            gate ? null : (
              <>
                <Button
                  variant='outlined'
                  color='inherit'
                  startIcon={<Iconify icon='solar:hourglass-linear' />}
                  disabled={vm.overdueCount === 0}
                  onClick={actions.onOpenOverdue}
                >
                  {MSG_D12.BTN_OVERDUE}
                </Button>
                <Button
                  variant='contained'
                  startIcon={<Iconify icon='solar:add-circle-linear' />}
                  disabled={vm.manualShowOptions.length === 0}
                  onClick={actions.onOpenManual}
                >
                  {MSG_D12.BTN_ADD}
                </Button>
              </>
            )
          }
        />
        {gate ?? (
          <>
            <PerformanceSelect
              options={vm.performances}
              value={vm.performanceId}
              onChange={vm.onPerformanceChange}
            />
            <ReservationKpiRow kpis={vm.kpis} />
            <Tabs
              value={vm.tab}
              onChange={(_, value: ReservationTab) => vm.onTabChange(value)}
              variant='scrollable'
              scrollButtons={false}
            >
              <Tab value='list' label={MSG_D12.TAB_LIST} />
              <Tab value='summary' label={MSG_D12.TAB_SUMMARY} />
              <Tab value='invite' label={MSG_D12.TAB_INVITE} />
            </Tabs>
            {vm.tab === 'list' ? (
              <Card>
                <Box
                  sx={{
                    p: { xs: 4, md: 6 },
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  <ReservationFilterBar
                    showOptions={vm.showOptions}
                    showFilter={vm.showFilter}
                    status={vm.status}
                    overdueOnly={vm.overdueOnly}
                    searchInput={vm.searchInput}
                    onShowFilterChange={vm.onShowFilterChange}
                    onStatusChange={vm.onStatusChange}
                    onToggleOverdue={vm.onToggleOverdue}
                    onSearchChange={vm.onSearchChange}
                  />
                </Box>
                {vm.countText ? (
                  <Box sx={{ px: { xs: 4, md: 6 }, pt: 4, pb: 1 }}>
                    <Typo.Caption.Regular color='text.secondary' role='status'>
                      {vm.countText}
                    </Typo.Caption.Regular>
                  </Box>
                ) : null}
                <Box
                  aria-busy={vm.isListFetching}
                  sx={{
                    opacity: vm.isListFetching && !vm.isListLoading ? 0.6 : 1,
                    transition: (t) => t.transitions.create('opacity'),
                  }}
                >
                  {list}
                </Box>
                <Pagination
                  page={vm.page}
                  totalPages={vm.totalPages}
                  onChange={vm.onPageChange}
                />
              </Card>
            ) : null}
            {vm.tab === 'summary' ? (
              <ReservationSummaryTab
                showSummary={vm.showSummary}
                tierSummary={vm.tierSummary}
                inviterSummary={vm.inviterSummary}
                isLoading={vm.isSummaryLoading}
                errorMessage={vm.isSummaryError ? vm.summaryErrorMessage : null}
                onRetry={vm.onRetrySummary}
              />
            ) : null}
            {vm.tab === 'invite' ? <InviteLinkTab invite={invite} /> : null}
          </>
        )}
      </SectionStack>
      <ReservationDetailDrawer
        open={vm.drawerReservation !== null}
        reservation={vm.drawerReservation}
        performanceTitle={vm.performanceTitle}
        onClose={vm.onCloseDetail}
        actions={
          vm.drawerRow ? (
            <>
              <ReservationIconActions row={vm.drawerRow} handlers={handlers} />
              <ReservationActionButtons
                row={vm.drawerRow}
                handlers={handlers}
                isBusy={actions.busyId === vm.drawerRow.id}
              />
            </>
          ) : null
        }
      />
      <ManualReservationDialog
        open={actions.isManualOpen}
        showOptions={vm.manualShowOptions}
        inviterOptions={invite.inviterOptions}
        tierOptions={vm.tierOptions}
        defaultStatus='PENDING'
        admitNowPlacement='bottom'
        isSubmitting={actions.isManualSubmitting}
        errorMessage={actions.manualError}
        onSubmit={actions.onSubmitManual}
        onClose={actions.onCloseManual}
      />
      <ReservationCancelDialog
        reservation={actions.cancelTarget}
        isSubmitting={actions.isDialogSubmitting}
        errorMessage={actions.dialogError}
        onSubmit={actions.onSubmitCancel}
        onClose={actions.onCloseDialog}
      />
      <ReservationMemoDialog
        reservation={actions.memoTarget}
        isSubmitting={actions.isDialogSubmitting}
        errorMessage={actions.dialogError}
        onSubmit={actions.onSubmitMemo}
        onClose={actions.onCloseDialog}
      />
      <ReservationItemsDialog
        reservation={actions.itemsTarget}
        tierOptions={vm.tierOptions}
        isSubmitting={actions.isDialogSubmitting}
        errorMessage={actions.dialogError}
        onSubmit={actions.onSubmitItems}
        onClose={actions.onCloseDialog}
      />
      <ConfirmDialog
        open={actions.isOverdueOpen}
        message={MSG_D12.OVERDUE_CONFIRM(vm.overdueCount)}
        description={MSG_D12.OVERDUE_CAP}
        confirmLabel={MSG_D12.OVERDUE_SUBMIT(vm.overdueCount)}
        isLoading={actions.isOverdueSubmitting}
        onConfirm={actions.onSubmitOverdue}
        onCancel={actions.onCloseOverdue}
      />
      <ConfirmDialog
        open={invite.isReissueOpen}
        message={MSG_D12.INV_REISSUE_CONFIRM}
        confirmLabel={MSG_D12.INV_REISSUE}
        confirmColor='primary'
        isLoading={invite.issuingId !== null}
        onConfirm={invite.onConfirmReissue}
        onCancel={invite.onCancelReissue}
      />
      <UndoSnackbar
        code={actions.undoCode}
        onUndo={actions.onUndo}
        onClose={actions.onCloseUndo}
      />
    </PageContainer>
  );
}
