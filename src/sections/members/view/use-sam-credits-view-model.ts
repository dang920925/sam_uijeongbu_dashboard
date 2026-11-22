'use client';

// ----------------------------------------------------------------------
// 배우 프로필 'SAM 출연작'·'참여 직함' ViewModel(R3 U26 보강 — design §12.1, develop §17.5). JSX 없음.
// - SAM 출연작 추가: 작품(비노출·종료 포함) → 배역(선택 사항 — 비우면 "출연" 묶음, 서버가 없으면 만든다) → 메모 → 저장.
//   배역이 하나도 없는 작품이면 "새 배역 추가" 이름 칸 — 이름을 넣으면 배역을 만들고 바로 연결, 비우면 "출연".
//   저장 = POST /members/{id}/cast-roles(작품 쪽 SCR-D14 와 같은 데이터).
// - 연결 해제: 기본 캐스트만 빠지고, 회차 지정이 남으면 안내 스낵바(계약 문구).
// - 참여 직함: 작품 + 직함 → 단원 연결 크레딧(비노출로 만들어짐). 삭제는 DELETE /credits/{id}.
// ----------------------------------------------------------------------
import { useState } from 'react';

import {
  useAddMemberCast,
  useAddMemberCredit,
  useCreateRole,
  useDeleteCredit,
  useMemberSamCredits,
  useRemoveMemberCast,
  useRolesOf,
} from '@/src/api/cast-queries';
import { usePerformances } from '@/src/api/performance-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  toPerformanceOptions,
  toRoleOptions,
  toSamCastRows,
  toSamCreditRows,
} from '@/src/sections/members/utils/sam-credits-display';
import { MSG_D05_SAM } from '@/src/shared/messages/d05-sam';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

const PERFORMANCE_QUERY = { page: 1, size: 100 };

interface CastDraft {
  performanceId: string;
  roleId: string;
  newRoleName: string;
  note: string;
}

const EMPTY_CAST: CastDraft = {
  performanceId: '',
  roleId: '',
  newRoleName: '',
  note: '',
};

export function useSamCreditsViewModel(memberId: string) {
  const snackbar = useAppSnackbar();
  const samQuery = useMemberSamCredits(memberId);
  const performancesQuery = usePerformances(PERFORMANCE_QUERY);
  const [castDraft, setCastDraft] = useState<CastDraft | null>(null);
  const [castError, setCastError] = useState<string | null>(null);
  const [creditDraft, setCreditDraft] = useState<{
    performanceId: string;
    title: string;
  } | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);
  const rolesQuery = useRolesOf(castDraft?.performanceId || null);
  const addCast = useAddMemberCast();
  const createRole = useCreateRole(castDraft?.performanceId ?? '');
  const removeCast = useRemoveMemberCast();
  const addCredit = useAddMemberCredit();
  const deleteCredit = useDeleteCredit();
  const onFail = (error: unknown) => snackbar.error(toApiErrorMessage(error));

  const roleOptions = toRoleOptions(rolesQuery.data ?? []);
  const hasNoRoles =
    castDraft !== null &&
    castDraft.performanceId !== '' &&
    rolesQuery.isSuccess &&
    (rolesQuery.data ?? []).length === 0;

  const linkCast = (draft: CastDraft, roleId: string | null) =>
    addCast.mutate(
      {
        memberId,
        body: {
          performanceId: draft.performanceId,
          roleId,
          note: draft.note.trim() === '' ? null : draft.note.trim(),
        },
      },
      {
        onSuccess: () => setCastDraft(null),
        onError: (error) => setCastError(toApiErrorMessage(error)),
      }
    );

  const submitCast = () => {
    if (!castDraft) return;
    if (castDraft.performanceId === '') {
      setCastError(MSG_D05_SAM.PERFORMANCE_REQUIRED);
      return;
    }
    setCastError(null);
    const newName = castDraft.newRoleName.trim();
    if (hasNoRoles && newName !== '') {
      createRole.mutate(
        { name: newName },
        {
          onSuccess: (role) => linkCast(castDraft, role.id),
          onError: (error) => setCastError(toApiErrorMessage(error)),
        }
      );
      return;
    }
    linkCast(castDraft, castDraft.roleId === '' ? null : castDraft.roleId);
  };

  const submitCredit = () => {
    if (!creditDraft) return;
    if (creditDraft.performanceId === '') {
      setCreditError(MSG_D05_SAM.PERFORMANCE_REQUIRED);
      return;
    }
    if (creditDraft.title.trim() === '') {
      setCreditError(MSG_D05_SAM.CREDIT_TITLE_REQUIRED);
      return;
    }
    setCreditError(null);
    addCredit.mutate(
      {
        memberId,
        body: {
          performanceId: creditDraft.performanceId,
          title: creditDraft.title.trim(),
        },
      },
      {
        onSuccess: () => setCreditDraft(null),
        onError: (error) => setCreditError(toApiErrorMessage(error)),
      }
    );
  };

  return {
    isLoading: samQuery.isPending,
    loadError: samQuery.isError ? toApiErrorMessage(samQuery.error) : null,
    onRetry: () => void samQuery.refetch(),
    castRows: samQuery.data ? toSamCastRows(samQuery.data) : [],
    creditRows: samQuery.data ? toSamCreditRows(samQuery.data) : [],
    performanceOptions: toPerformanceOptions(
      performancesQuery.data?.items ?? []
    ),
    castForm: {
      draft: castDraft,
      roleOptions,
      hasNoRoles,
      error: castError,
      isSaving: addCast.isPending || createRole.isPending,
      onOpen: () => {
        setCastDraft(EMPTY_CAST);
        setCastError(null);
      },
      onCancel: () => setCastDraft(null),
      onChange: (patch: Partial<CastDraft>) =>
        setCastDraft((prev) =>
          prev
            ? {
                ...prev,
                ...patch,
                // 작품을 바꾸면 배역·새 배역은 비운다
                ...(patch.performanceId !== undefined
                  ? { roleId: '', newRoleName: '' }
                  : {}),
              }
            : prev
        ),
      onSubmit: submitCast,
    },
    onUnlink: (roleId: string) =>
      removeCast.mutate(
        { memberId, roleId },
        {
          onSuccess: (result) => {
            if (result.showOverrideCount > 0)
              snackbar.success(
                MSG_D05_SAM.overrideLeft(result.showOverrideCount)
              );
          },
          onError: onFail,
        }
      ),
    creditForm: {
      draft: creditDraft,
      error: creditError,
      isSaving: addCredit.isPending,
      onOpen: () => {
        setCreditDraft({ performanceId: '', title: '' });
        setCreditError(null);
      },
      onCancel: () => setCreditDraft(null),
      onChange: (patch: { performanceId?: string; title?: string }) =>
        setCreditDraft((prev) => (prev ? { ...prev, ...patch } : prev)),
      onSubmit: submitCredit,
    },
    onDeleteCredit: (id: string) =>
      deleteCredit.mutate(id, { onError: onFail }),
  };
}

export type SamCreditsViewModel = ReturnType<typeof useSamCreditsViewModel>;
