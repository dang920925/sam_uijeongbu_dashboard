'use client';

// ----------------------------------------------------------------------
// SCR-D06 신청서 관리 View — props 만으로 그린다. 목록 칸(표·스켈레톤·빈·오류)은 Container 가 골라 list 로 준다.
// 순서(design SCR-D06): 머리("미처리 {n}건" 오른쪽) → 탭 → 상태 필터·총 건수 → 카드(표/카드 리스트) → 페이지네이션.
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import type { ReactNode } from 'react';

import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { MemberFormDialog } from '@/src/components/member-form-dialog';
import { PageContainer } from '@/src/components/page-container';
import { PageHead } from '@/src/components/page-head';
import { Pagination } from '@/src/components/pagination';
import { SectionStack } from '@/src/components/section-stack';
import { ApplicationDetailDialog } from '@/src/sections/applications/components/application-detail-dialog';
import { ApplicationFilterBar } from '@/src/sections/applications/components/application-filter-bar';
import { ApplicationPendingAlert } from '@/src/sections/applications/components/application-pending-alert';
import type { ApplicationsViewModel } from '@/src/sections/applications/view/use-applications-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D06 } from '@/src/shared/messages/d06';
import type { ApplicationType } from '@/src/types/codes';

interface ApplicationsViewProps {
  vm: ApplicationsViewModel;
  list: ReactNode;
}

const EMPTY_FORM = { name: '', phone: '', type: 'GENERAL' as const };

export function ApplicationsView({ vm, list }: ApplicationsViewProps) {
  return (
    <PageContainer>
      <SectionStack>
        <PageHead
          title={MSG_D06.TITLE}
          subtitle={MSG_D06.SUBTITLE}
          actions={
            vm.pendingCount > 0 ? (
              <ApplicationPendingAlert count={vm.pendingCount} />
            ) : null
          }
        />
        <Tabs
          value={vm.appType}
          onChange={(_, value: ApplicationType) => vm.onTabChange(value)}
          variant='scrollable'
          scrollButtons={false}
        >
          <Tab value='WORK_OBSERVATION' label={MSG_D06.TAB_OBSERVATION} />
          <Tab value='CONSULTATION' label={MSG_D06.TAB_CONSULTATION} />
        </Tabs>
        <ApplicationFilterBar
          status={vm.status}
          totalCount={vm.isLoading ? null : vm.totalCount}
          onStatusChange={vm.onStatusChange}
        />
        <div className='flex flex-col gap-4'>
          <Card>{list}</Card>
          <Pagination
            page={vm.page}
            totalPages={vm.totalPages}
            onChange={vm.onPageChange}
          />
        </div>
      </SectionStack>
      <ApplicationDetailDialog
        detail={vm.detail}
        handlers={{
          onRequestApprove: vm.onRequestApprove,
          onRequestReject: vm.onRequestReject,
          onRequestRegister: vm.onRequestRegister,
        }}
        onClose={vm.onCloseDetail}
      />
      <ConfirmDialog
        open={vm.confirmKind !== null}
        message={vm.confirmMessage}
        confirmLabel={
          vm.confirmKind === 'reject' ? MSG_D06.REJECT : MSG_D06.APPROVE
        }
        confirmColor={vm.confirmKind === 'reject' ? 'error' : 'primary'}
        isLoading={vm.isConfirming}
        onConfirm={vm.onConfirm}
        onCancel={vm.onCancelConfirm}
      />
      <MemberFormDialog
        open={vm.registerInitial !== null}
        title={MSG_D06.REGISTER}
        submitLabel={MSG_COMMON.REGISTER}
        initialValue={vm.registerInitial ?? EMPTY_FORM}
        isSubmitting={vm.isRegistering}
        onSubmit={vm.onSubmitRegister}
        onClose={vm.onCloseRegister}
      />
    </PageContainer>
  );
}
