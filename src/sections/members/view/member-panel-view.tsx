'use client';

// ----------------------------------------------------------------------
// 단원 상세 패널 View — 틀(MembersPanel) + 본문(배우 프로필 / 일반 정보 / 로딩·오류) + 구분선 + "단원 삭제"
// + 삭제 확인(ConfirmDialog). props 만으로 렌더.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import type { ReactNode } from 'react';

import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { MembersPanel } from '@/src/sections/members/components/members-panel';
import type { MemberPanelViewModel } from '@/src/sections/members/view/use-member-panel-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D05 } from '@/src/shared/messages/d05';

interface MemberPanelViewProps {
  title: string;
  onClose: () => void;
  canDelete: boolean;
  deleteConfirm: MemberPanelViewModel['deleteConfirm'];
  children: ReactNode;
}

export function MemberPanelView({
  title,
  onClose,
  canDelete,
  deleteConfirm,
  children,
}: MemberPanelViewProps) {
  return (
    <MembersPanel open title={title} onClose={onClose}>
      {children}
      {canDelete ? (
        <>
          <Divider />
          <Button
            color='error'
            size='small'
            onClick={deleteConfirm.onOpen}
            sx={{ alignSelf: 'center' }}
          >
            {MSG_D05.DELETE}
          </Button>
        </>
      ) : null}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        message={deleteConfirm.message}
        confirmLabel={MSG_COMMON.DELETE}
        isLoading={deleteConfirm.isDeleting}
        onConfirm={deleteConfirm.onConfirm}
        onCancel={deleteConfirm.onCancel}
      />
    </MembersPanel>
  );
}
