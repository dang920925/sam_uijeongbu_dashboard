'use client';

// ----------------------------------------------------------------------
// 연출진 관리(SCR-D09) ViewModel — 목록 행 가공, 추가·수정 다이얼로그, 삭제 확인. JSX 없음.
// - 저장 성공: 다이얼로그 닫고 스낵바 "저장되었습니다"(현행 Members.tsx:278). 실패: 다이얼로그 안 서버 문구.
// - 삭제 실패·목록 조회 실패: 스낵바(서버 message). 삭제 성공은 행이 사라지는 것으로 알린다(현행에 문구 없음 — 자체 결정).
// ----------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useState } from 'react';

import { toStaffFormInput, type StaffFormInput } from '@/src/api/staff-mapper';
import {
  useCreateStaff,
  useDeleteStaff,
  useSaveStaff,
  useStaffList,
} from '@/src/api/staff-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { ApiError } from '@/src/lib/api-client';
import {
  createEmptyStaffForm,
  nextDisplayOrder,
} from '@/src/sections/staff/utils/staff-form';
import { toStaffRow } from '@/src/sections/staff/utils/staff-row';
import { MSG_API, MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D09 } from '@/src/shared/messages/d09';
import type { Staff } from '@/src/types/content';

const toErrorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : MSG_API.SERVER_ERROR;

type DialogState =
  | { mode: 'create'; initialValue: StaffFormInput }
  | { mode: 'edit'; id: string; initialValue: StaffFormInput };

export function useStaffViewModel() {
  const snackbar = useAppSnackbar();
  const query = useStaffList();
  const createMutation = useCreateStaff();
  const saveMutation = useSaveStaff();
  const deleteMutation = useDeleteStaff();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const { error: queryError, errorUpdatedAt } = query;

  useEffect(() => {
    if (queryError) snackbar.error(toErrorMessage(queryError));
  }, [queryError, errorUpdatedAt, snackbar]);

  const items = useMemo(() => query.data ?? [], [query.data]);
  const rows = useMemo(() => items.map(toStaffRow), [items]);
  const findItem = useCallback(
    (id: string) => items.find((s) => s.id === id) ?? null,
    [items]
  );

  const openCreate = () => {
    setSubmitError(null);
    setDialog({
      mode: 'create',
      initialValue: createEmptyStaffForm(
        nextDisplayOrder(items.map((s) => s.displayOrder))
      ),
    });
  };

  const openEdit = (id: string) => {
    const staff = findItem(id);
    if (!staff) return;
    setSubmitError(null);
    setDialog({ mode: 'edit', id, initialValue: toStaffFormInput(staff) });
  };

  const handleSubmit = async (input: StaffFormInput) => {
    if (!dialog) return;
    setSubmitError(null);
    try {
      if (dialog.mode === 'create') await createMutation.mutateAsync(input);
      else await saveMutation.mutateAsync({ id: dialog.id, input });
      setDialog(null);
      snackbar.success(MSG_COMMON.SAVED);
    } catch (e: unknown) {
      setSubmitError(toErrorMessage(e));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
    } catch (e: unknown) {
      snackbar.error(toErrorMessage(e));
    } finally {
      setDeleteTarget(null);
    }
  };

  return {
    isLoading: query.isPending,
    isError: query.isError && !query.data,
    errorMessage: toErrorMessage(queryError),
    onRetry: () => void query.refetch(),
    rows,
    onAdd: openCreate,
    onEdit: openEdit,
    onDeleteRequest: (id: string) => setDeleteTarget(findItem(id)),
    dialog: {
      open: dialog !== null,
      mode: dialog?.mode ?? 'create',
      initialValue: dialog?.initialValue ?? createEmptyStaffForm(0),
      isSubmitting: createMutation.isPending || saveMutation.isPending,
      errorMessage: submitError,
      onSubmit: (input: StaffFormInput) => void handleSubmit(input),
      onClose: () => setDialog(null),
    },
    deleteConfirm: {
      open: deleteTarget !== null,
      message: deleteTarget ? MSG_D09.deleteConfirm(deleteTarget.name) : '',
      isLoading: deleteMutation.isPending,
      onConfirm: () => void handleDeleteConfirm(),
      onCancel: () => setDeleteTarget(null),
    },
  };
}
