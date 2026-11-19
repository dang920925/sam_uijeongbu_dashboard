'use client';

// ----------------------------------------------------------------------
// 단원 상세 패널 ViewModel(FN-11·12). JSX 없음.
// - 단원은 useMember(id) 로 따로 읽는다(목록의 다른 쪽·다른 필터에 있는 단원도 URL 로 열 수 있게).
// - 배우만 프로필을 읽는다(일반 단원은 연락처·가입일 — FN-12 수용 기준).
// - 삭제: ConfirmDialog "{이름}을(를) 삭제하시겠습니까?" → 성공 시 패널 닫음, 실패 시 확인창 닫고 스낵바.
// ----------------------------------------------------------------------
import { useState } from 'react';

import {
  useActorProfile,
  useDeleteMember,
  useMember,
} from '@/src/api/member-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { toApiErrorMessage } from '@/src/utils/api-error-message';
import { formatJoinedDate } from '@/src/sections/members/utils/member-display';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { formatMemberDeleteConfirm } from '@/src/shared/messages/d05';

export function useMemberPanelViewModel(memberId: string, onClose: () => void) {
  const snackbar = useAppSnackbar();
  const memberQuery = useMember(memberId);
  const member = memberQuery.data ?? null;
  const isActor = member?.type === 'ACTOR';
  const profileQuery = useActorProfile(isActor ? memberId : null);
  const deleteMember = useDeleteMember();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = () => {
    deleteMember.mutate(memberId, {
      onSuccess: () => {
        setIsConfirmOpen(false);
        onClose();
      },
      onError: (error) => {
        setIsConfirmOpen(false);
        snackbar.error(toApiErrorMessage(error));
      },
    });
  };

  const isLoading =
    memberQuery.isPending || (isActor && profileQuery.isPending);
  const error = memberQuery.error ?? (isActor ? profileQuery.error : null);

  return {
    title: member?.name ?? '',
    isLoading,
    errorMessage: error ? toApiErrorMessage(error) : null,
    onRetry: () => {
      void memberQuery.refetch();
      if (isActor) void profileQuery.refetch();
    },
    member,
    profile: profileQuery.data ?? null,
    general: member
      ? {
          phoneText: member.phone ?? MSG_COMMON.EMPTY_VALUE,
          joinedText: formatJoinedDate(member),
        }
      : null,
    onClose,
    deleteConfirm: {
      isOpen: isConfirmOpen,
      message: member ? formatMemberDeleteConfirm(member.name) : '',
      isDeleting: deleteMember.isPending,
      onOpen: () => setIsConfirmOpen(true),
      onConfirm: handleDelete,
      onCancel: () => setIsConfirmOpen(false),
    },
  };
}

export type MemberPanelViewModel = ReturnType<typeof useMemberPanelViewModel>;
