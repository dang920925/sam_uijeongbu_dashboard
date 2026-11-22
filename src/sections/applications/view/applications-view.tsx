'use client';

// ----------------------------------------------------------------------
// SCR-D06 신청서 관리 View — props 만으로 그린다. 목록 칸(표·스켈레톤·빈·오류)은 Container 가 골라 list 로 준다.
// 순서(designer §18.3 SCR-D06-U31B): 머리("미처리 n건 · 연락 전 n건" 오른쪽) → 유형 pill → 필터·총 건수 →
// 카드(한 행 목록 / xs 카드) → 페이지네이션. 행 클릭 → 상세 드로어.
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';
import type { ReactNode } from 'react';

import { MemberFormDialog } from '@/src/components/member-form-dialog';
import { PageContainer } from '@/src/components/page-container';
import { PageHead } from '@/src/components/page-head';
import { Pagination } from '@/src/components/pagination';
import { SectionStack } from '@/src/components/section-stack';
import { ApplicationDetailDrawer } from '@/src/sections/applications/components/application-detail-drawer';
import { ApplicationFilterBar } from '@/src/sections/applications/components/application-filter-bar';
import { ApplicationPendingAlert } from '@/src/sections/applications/components/application-pending-alert';
import type { ApplicationsViewModel } from '@/src/sections/applications/view/use-applications-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D06 } from '@/src/shared/messages/d06';

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
              <ApplicationPendingAlert
                count={vm.pendingCount}
                uncontactedCount={vm.uncontactedCount}
              />
            ) : null
          }
        />
        <ApplicationFilterBar
          filters={vm.filters}
          totalCount={vm.isLoading ? null : vm.totalCount}
          workOptions={vm.workOptions}
          progressOptions={vm.progressOptions}
          onAppTypeChange={vm.onAppTypeChange}
          onWorkChange={vm.onWorkChange}
          onContactChange={vm.onContactFilterChange}
          onProgressChange={vm.onProgressFilterChange}
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
      <ApplicationDetailDrawer
        detail={vm.detail}
        memo={vm.memo}
        isSavingMemo={vm.isSavingMemo}
        handlers={{
          onToggleContact: vm.onToggleContact,
          onChangeProgress: vm.onChangeProgress,
          onMemoChange: vm.onMemoChange,
          onSaveMemo: vm.onSaveMemo,
          onRequestRegister: vm.onRequestRegister,
        }}
        onClose={vm.onCloseDetail}
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
