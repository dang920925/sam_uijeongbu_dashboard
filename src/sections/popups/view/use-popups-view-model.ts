'use client';

// ----------------------------------------------------------------------
// 팝업 관리(SCR-D10) ViewModel — 행 가공(기간 상태는 오늘 KST 기준), 추가·수정 다이얼로그, 겹침 미리 계산, 삭제 확인.
// - 겹침은 막지 않는다(FN-17): 목록 행은 서버 overlapsActive, 다이얼로그는 입력 중 값으로 같은 규칙을 계산.
// - 저장 성공: 닫고 스낵바 "저장되었습니다"(현행 Members.tsx:278). 실패: 다이얼로그 안 서버 문구(POP_002·UPL_003 등).
// - 삭제 실패·목록 조회 실패: 스낵바. 삭제 성공은 행이 사라지는 것으로 알린다(현행에 문구 없음 — 자체 결정).
// ----------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useState } from 'react';

import { toPopupFormInput, type PopupFormInput } from '@/src/api/popup-mapper';
import {
  useCreatePopup,
  useDeletePopup,
  usePopups,
  useSavePopup,
} from '@/src/api/popup-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { EMPTY_POPUP_FORM } from '@/src/sections/popups/utils/popup-form';
import { overlapsActivePopups } from '@/src/sections/popups/utils/popup-period';
import { toPopupRow } from '@/src/sections/popups/utils/popup-row';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { toApiErrorMessage as toErrorMessage } from '@/src/utils/api-error-message';
import { todayKst } from '@/src/utils/kst-date-format';

type DialogState =
  | { mode: 'create'; initialValue: PopupFormInput }
  | { mode: 'edit'; id: string; initialValue: PopupFormInput };

export function usePopupsViewModel() {
  const snackbar = useAppSnackbar();
  const query = usePopups();
  const createMutation = useCreatePopup();
  const saveMutation = useSavePopup();
  const deleteMutation = useDeletePopup();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { error: queryError, errorUpdatedAt } = query;

  useEffect(() => {
    if (queryError) snackbar.error(toErrorMessage(queryError));
  }, [queryError, errorUpdatedAt, snackbar]);

  const items = useMemo(() => query.data ?? [], [query.data]);
  const rows = useMemo(() => {
    const today = todayKst();
    return items.map((p) => toPopupRow(p, today));
  }, [items]);

  const editingId = dialog?.mode === 'edit' ? dialog.id : null;
  const checkOverlap = useCallback(
    (input: PopupFormInput) =>
      overlapsActivePopups({ ...input, id: editingId }, items),
    [items, editingId]
  );

  const openCreate = () => {
    setSubmitError(null);
    setDialog({ mode: 'create', initialValue: EMPTY_POPUP_FORM });
  };

  const openEdit = (id: string) => {
    const popup = items.find((p) => p.id === id);
    if (!popup) return;
    setSubmitError(null);
    setDialog({ mode: 'edit', id, initialValue: toPopupFormInput(popup) });
  };

  const handleSubmit = async (input: PopupFormInput) => {
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
    if (!deleteTargetId) return;
    try {
      await deleteMutation.mutateAsync(deleteTargetId);
    } catch (e: unknown) {
      snackbar.error(toErrorMessage(e));
    } finally {
      setDeleteTargetId(null);
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
    onDeleteRequest: setDeleteTargetId,
    dialog: {
      open: dialog !== null,
      mode: dialog?.mode ?? 'create',
      initialValue: dialog?.initialValue ?? EMPTY_POPUP_FORM,
      isSubmitting: createMutation.isPending || saveMutation.isPending,
      errorMessage: submitError,
      checkOverlap,
      onSubmit: (input: PopupFormInput) => void handleSubmit(input),
      onClose: () => setDialog(null),
    },
    deleteConfirm: {
      open: deleteTargetId !== null,
      isLoading: deleteMutation.isPending,
      onConfirm: () => void handleDeleteConfirm(),
      onCancel: () => setDeleteTargetId(null),
    },
  };
}
