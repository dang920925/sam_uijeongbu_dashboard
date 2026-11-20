'use client';

// ----------------------------------------------------------------------
// SCR-D05 단원 관리 ViewModel(FN-11). JSX 없음.
// - 필터 pill(전체/배우/일반) + 페이지네이션 20. 필터를 바꾸면 1쪽으로, 열린 패널은 닫는다(현행 setSelectedMember(null)).
// - 선택 단원은 URL `?member=<id>` 가 정본 — 신청서 "단원 등록됨" 링크(paths.members.detail)로 와도 패널이 열린다.
// - 단원 추가: 공용 MemberFormDialog. 실패는 다이얼로그 안 문구(서버 message).
// ----------------------------------------------------------------------
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { paths } from '@/app/paths';
import { useCreateMember, useMembers } from '@/src/api/member-queries';
import { toApiErrorMessage } from '@/src/utils/api-error-message';
import {
  MEMBER_FILTER_OPTIONS,
  toMemberListQuery,
  toMemberRowDisplay,
  type MemberFilter,
} from '@/src/sections/members/utils/member-display';
import type { MemberFormInput } from '@/src/types/member';
import { useErrorSnackbar } from '@/src/hooks/use-error-snackbar';

const MEMBER_PARAM = 'member';
const EMPTY_MEMBER_FORM: MemberFormInput = {
  name: '',
  phone: '',
  type: 'GENERAL',
};

export function useMembersViewModel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get(MEMBER_PARAM);
  const [filter, setFilter] = useState<MemberFilter>('ALL');
  const [page, setPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const membersQuery = useMembers(toMemberListQuery(filter, page));
  const createMember = useCreateMember();

  const closePanel = () =>
    router.replace(paths.members.root, { scroll: false });

  const handleAddSubmit = (input: MemberFormInput) => {
    setAddError(null);
    createMember.mutate(input, {
      onSuccess: () => setIsAddOpen(false),
      onError: (error) => setAddError(toApiErrorMessage(error)),
    });
  };

  const data = membersQuery.data;
  useErrorSnackbar(
    membersQuery.isError ? toApiErrorMessage(membersQuery.error) : null
  );
  return {
    filterOptions: MEMBER_FILTER_OPTIONS,
    filter,
    onFilterChange: (next: MemberFilter) => {
      setFilter(next);
      setPage(1);
      if (selectedId) closePanel();
    },
    list: {
      isLoading: membersQuery.isPending,
      errorMessage: membersQuery.isError
        ? toApiErrorMessage(membersQuery.error)
        : null,
      onRetry: () => void membersQuery.refetch(),
      rows: (data?.items ?? []).map(toMemberRowDisplay),
      page,
      totalPages: data?.totalPages ?? 0,
      onPageChange: setPage,
    },
    selectedId,
    onSelect: (id: string) =>
      router.replace(paths.members.detail(id), { scroll: false }),
    onClosePanel: closePanel,
    addDialog: {
      isOpen: isAddOpen,
      initialValue: EMPTY_MEMBER_FORM,
      isSubmitting: createMember.isPending,
      errorMessage: addError,
      onOpen: () => {
        setAddError(null);
        setIsAddOpen(true);
      },
      onClose: () => setIsAddOpen(false),
      onSubmit: handleAddSubmit,
    },
  };
}

export type MembersViewModel = ReturnType<typeof useMembersViewModel>;
