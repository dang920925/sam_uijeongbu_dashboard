'use client';

// ----------------------------------------------------------------------
// SCR-D14 '참여자' ViewModel(design §12 — develop §17.3). JSX 없음.
// 행 = 순서(▲▼) · 직함 · 사람 · 노출 스위치 · 이유 · 수정 · 삭제. 다이얼로그 = 직함 + 사람(연출진/단원/이름만) + 노출.
// ----------------------------------------------------------------------
import { useState } from 'react';

import { toCreditFormInput, toCreditRequest } from '@/src/api/cast-mapper';
import {
  useCreateCredit,
  useDeleteCredit,
  usePatchCredit,
  useReorderCredits,
} from '@/src/api/cast-queries';
import { useMembers } from '@/src/api/member-queries';
import { useStaffList } from '@/src/api/staff-queries';
import type { AppSnackbar } from '@/src/hooks/use-app-snackbar';
import type { CastPublicContext } from '@/src/sections/performance-cast/utils/cast-reasons';
import {
  moveId,
  toCreditRows,
} from '@/src/sections/performance-cast/utils/cast-rows';
import { validateCreditForm } from '@/src/sections/performance-cast/utils/credit-form';
import type { AdminCredit, CreditFormInput } from '@/src/types/cast';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export interface CreditDialogState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValue: CreditFormInput;
  staffOptions: { value: string; label: string }[];
  memberOptions: { value: string; label: string }[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (input: CreditFormInput) => void;
  onClose: () => void;
}

const EMPTY: CreditFormInput = {
  title: '',
  kind: 'staff',
  staffId: null,
  memberId: null,
  displayName: '',
  isVisible: false,
};
const MEMBER_QUERY = { page: 1, size: 100 } as const;

export function useCreditSection(
  performanceId: string,
  credits: AdminCredit[],
  ctx: CastPublicContext,
  snackbar: AppSnackbar
) {
  const [target, setTarget] = useState<
    { mode: 'create' } | { mode: 'edit'; credit: AdminCredit } | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const staffQuery = useStaffList();
  const membersQuery = useMembers(MEMBER_QUERY);
  const create = useCreateCredit(performanceId);
  const patch = usePatchCredit();
  const remove = useDeleteCredit();
  const reorder = useReorderCredits(performanceId);
  const onFail = (error: unknown) => snackbar.error(toApiErrorMessage(error));

  const close = () => {
    setTarget(null);
    setErrorMessage(null);
  };

  const submit = (input: CreditFormInput) => {
    const invalid = validateCreditForm(input);
    if (invalid) {
      setErrorMessage(invalid);
      return;
    }
    const body = toCreditRequest(input);
    const onError = (error: unknown) =>
      setErrorMessage(toApiErrorMessage(error));
    if (target?.mode === 'edit') {
      patch.mutate(
        { id: target.credit.id, body },
        { onSuccess: close, onError }
      );
    } else {
      create.mutate(body, { onSuccess: close, onError });
    }
  };

  const deleteTarget = credits.find((c) => c.id === deleteId) ?? null;

  const dialog: CreditDialogState = {
    isOpen: target !== null,
    mode: target?.mode ?? 'create',
    initialValue:
      target?.mode === 'edit' ? toCreditFormInput(target.credit) : EMPTY,
    staffOptions: (staffQuery.data ?? []).map((s) => ({
      value: s.id,
      label: s.name,
    })),
    memberOptions: (membersQuery.data?.items ?? []).map((m) => ({
      value: m.id,
      label: m.name,
    })),
    isSubmitting: create.isPending || patch.isPending,
    errorMessage,
    onSubmit: submit,
    onClose: close,
  };

  return {
    rows: toCreditRows(credits, ctx),
    dialog,
    onAdd: () => setTarget({ mode: 'create' }),
    onEdit: (id: string) => {
      const credit = credits.find((c) => c.id === id);
      if (credit) setTarget({ mode: 'edit', credit });
    },
    onToggleVisible: (id: string, isVisible: boolean) =>
      patch.mutate({ id, body: { isVisible } }, { onError: onFail }),
    onMove: (id: string, direction: -1 | 1) => {
      const next = moveId(
        credits.map((c) => c.id),
        id,
        direction
      );
      if (next) reorder.mutate(next, { onError: onFail });
    },
    deleteConfirm: {
      isOpen: deleteTarget !== null,
      title: deleteTarget?.title ?? '',
      isDeleting: remove.isPending,
      onRequest: (id: string) => setDeleteId(id),
      onConfirm: () => {
        if (!deleteId) return;
        remove.mutate(deleteId, {
          onSuccess: () => setDeleteId(null),
          onError: (error) => {
            setDeleteId(null);
            onFail(error);
          },
        });
      },
      onCancel: () => setDeleteId(null),
    },
  };
}
