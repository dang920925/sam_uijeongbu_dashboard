'use client';

// ----------------------------------------------------------------------
// 단원 상세 패널 ViewModel(FN-11·12). JSX 없음.
// - 단원은 useMember(id) 로 따로 읽는다(목록의 다른 쪽·다른 필터에 있는 단원도 URL 로 열 수 있게).
// - 배우만 프로필을 읽는다(일반 단원은 연락처·가입일 — FN-12 수용 기준).
// - 삭제: ConfirmDialog "{이름}을(를) 삭제하시겠습니까?" → 성공 시 패널 닫음, 실패 시 확인창 닫고 스낵바.
// - (U36) 배우: "예매 초대자 목록에 표시" 스위치 → PATCH inviterListed(진행 중엔 바뀔 값을 미리 보임, 실패 스낵바).
// ----------------------------------------------------------------------
import { useState } from 'react';

import {
  useActorProfile,
  useDeleteMember,
  useMember,
  useSaveMember,
} from '@/src/api/member-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  isNotFoundError,
  toApiErrorMessage,
} from '@/src/utils/api-error-message';
import { formatJoinedDate } from '@/src/sections/members/utils/member-display';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { formatMemberDeleteConfirm } from '@/src/shared/messages/d05';
import { useQueryClient } from '@tanstack/react-query';
import { useErrorSnackbar } from '@/src/hooks/use-error-snackbar';
import { findMemberNameInLists } from '@/src/sections/members/utils/find-member-name';

export function useMemberPanelViewModel(memberId: string, onClose: () => void) {
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();
  const memberQuery = useMember(memberId);
  const member = memberQuery.data ?? null;
  const isActor = member?.type === 'ACTOR';
  const profileQuery = useActorProfile(isActor ? memberId : null);
  const deleteMember = useDeleteMember();
  const saveMember = useSaveMember();
  /** 마지막으로 바꾼 값(실패하면 지운다) — 다시 받은 단원 값이 오기 전에도 스위치가 되돌아가지 않게 */
  const [listedSet, setListedSet] = useState<{
    id: string;
    value: boolean;
  } | null>(null);
  const pendingListed =
    listedSet && listedSet.id === memberId ? listedSet.value : undefined;
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
        // 이미 지워진 단원(404 MEM_001)이면 패널도 닫는다 — 목록은 쿼리 훅이 다시 불러온다(qa1 QA1-012)
        if (isNotFoundError(error)) onClose();
      },
    });
  };

  const isLoading =
    memberQuery.isPending || (isActor && profileQuery.isPending);
  const error = memberQuery.error ?? (isActor ? profileQuery.error : null);
  // 404 는 패널 안 문구만, 그 밖 조회 오류는 스낵바도(designer panel-error 프레임 — qa1 QA1-008)
  useErrorSnackbar(
    error && !isNotFoundError(error) ? toApiErrorMessage(error) : null
  );
  // 상세 조회가 실패해도 목록에서 이미 아는 이름을 패널 머리에 보인다(panel-error 프레임 "[이름]")
  const listName = findMemberNameInLists(queryClient, memberId);

  return {
    title: member?.name ?? listName ?? '',
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
    inviterSwitch:
      member && isActor
        ? {
            checked: pendingListed ?? member.inviterListed,
            disabled: saveMember.isPending,
            onChange: (checked: boolean) => {
              setListedSet({ id: member.id, value: checked });
              saveMember.mutate(
                { id: member.id, input: { inviterListed: checked } },
                {
                  onError: (e) => {
                    setListedSet(null);
                    snackbar.error(toApiErrorMessage(e));
                  },
                }
              );
            },
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
