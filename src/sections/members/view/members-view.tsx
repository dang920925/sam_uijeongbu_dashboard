'use client';

// ----------------------------------------------------------------------
// SCR-D05 단원 관리 View — props 만으로 렌더.
// 머리("단원 관리" / 부제 / "단원 추가") → 필터 pill → [목록 카드 + 페이지네이션 | lg 오른쪽 패널 320(gap 24)]
// + 단원 추가(공용 MemberFormDialog). 목록 영역 상태 분기는 컨테이너가 list 로 넘긴다.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import type { ReactNode } from 'react';

import { Iconify } from '@/src/components/iconify';
import { MemberFormDialog } from '@/src/components/member-form-dialog';
import { PageContainer } from '@/src/components/page-container';
import { PageHead } from '@/src/components/page-head';
import { Pagination } from '@/src/components/pagination';
import { SectionStack } from '@/src/components/section-stack';
import { SegmentPill } from '@/src/components/segment-pill';
import type { MemberFilter } from '@/src/sections/members/utils/member-display';
import type { MembersViewModel } from '@/src/sections/members/view/use-members-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D05 } from '@/src/shared/messages/d05';

interface MembersViewProps {
  filterOptions: MembersViewModel['filterOptions'];
  filter: MemberFilter;
  onFilterChange: (filter: MemberFilter) => void;
  list: ReactNode;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  panel: ReactNode;
  addDialog: MembersViewModel['addDialog'];
}

export function MembersView({
  filterOptions,
  filter,
  onFilterChange,
  list,
  page,
  totalPages,
  onPageChange,
  panel,
  addDialog,
}: MembersViewProps) {
  return (
    <PageContainer>
      <SectionStack>
        <PageHead
          title={MSG_D05.TITLE}
          subtitle={MSG_D05.SUBTITLE}
          actions={
            <Button
              variant='contained'
              onClick={addDialog.onOpen}
              startIcon={<Iconify icon='solar:add-circle-linear' />}
            >
              {MSG_D05.ADD}
            </Button>
          }
        />
        <SegmentPill
          ariaLabel={MSG_D05.FILTER_ARIA}
          options={filterOptions}
          value={filter}
          onChange={onFilterChange}
        />
        <div className='flex items-start gap-6'>
          <div className='flex min-w-0 flex-1 flex-col gap-4'>
            <Card>{list}</Card>
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={onPageChange}
            />
          </div>
          {panel}
        </div>
      </SectionStack>
      <MemberFormDialog
        open={addDialog.isOpen}
        title={MSG_D05.ADD}
        submitLabel={MSG_COMMON.ADD}
        initialValue={addDialog.initialValue}
        isSubmitting={addDialog.isSubmitting}
        errorMessage={addDialog.errorMessage}
        onSubmit={addDialog.onSubmit}
        onClose={addDialog.onClose}
      />
    </PageContainer>
  );
}
