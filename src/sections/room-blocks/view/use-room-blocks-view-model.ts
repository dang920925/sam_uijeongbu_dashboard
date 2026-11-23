'use client';

// ----------------------------------------------------------------------
// (U46) 연습실 '시간 막기' 탭 ViewModel. JSX 없음.
// - 목록 · 추가/수정 다이얼로그 · 삭제(확인) · 이 날만 해제(날짜 고르기).
// - 저장: 폼 검증 → 겹치는 팀 예약 조회(conflicts) → 없으면 바로 저장, 있으면 목록과 함께
//   '겹치는 예약 취소하고 저장'(CANCEL) · '그대로 저장'(KEEP) 을 고르게 한다. 실패 문구는 다이얼로그 안.
// ----------------------------------------------------------------------
import { useState } from 'react';

import {
  useDeleteRoomBlock,
  useRoomBlockConflicts,
  useRoomBlocks,
  useSaveRoomBlock,
  useSkipRoomBlockDate,
} from '@/src/api/practice-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  emptyRoomBlockForm,
  type RoomBlockForm,
  type RoomBlockFormErrors,
  toRoomBlockForm,
  toRoomBlockRequest,
  toRoomBlockRow,
  validateRoomBlockForm,
} from '@/src/sections/room-blocks/utils/room-block-form';
import { kstDateOf } from '@/src/sections/room-reservations/utils/room-week';
import { MSG_BLOCKS } from '@/src/shared/messages/room-blocks';
import type { RoomBlockConflictResponse } from '@/src/types/practice';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

interface DialogState {
  id: string | null;
  form: RoomBlockForm;
  errors: RoomBlockFormErrors;
  serverError: string | null;
  conflicts: RoomBlockConflictResponse[] | null;
  checking: boolean;
}

export function useRoomBlocksViewModel() {
  const snackbar = useAppSnackbar();
  const [today] = useState(() => kstDateOf(new Date()));
  const query = useRoomBlocks();
  const save = useSaveRoomBlock();
  const remove = useDeleteRoomBlock();
  const skip = useSkipRoomBlockDate();
  const checkConflicts = useRoomBlockConflicts();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [skipState, setSkipState] = useState<{
    id: string;
    date: string;
  } | null>(null);

  const blocks = query.data ?? [];
  const deleteTarget = blocks.find((b) => b.id === deleteId) ?? null;
  const skipTarget = blocks.find((b) => b.id === skipState?.id) ?? null;

  const patchDialog = (patch: Partial<DialogState>) =>
    setDialog((d) => (d ? { ...d, ...patch } : d));

  const submit = (state: DialogState, onConflict?: 'CANCEL' | 'KEEP') =>
    save.mutate(
      {
        id: state.id,
        body: { ...toRoomBlockRequest(state.form), onConflict },
      },
      {
        onSuccess: () => {
          setDialog(null);
          snackbar.success(MSG_BLOCKS.SAVED);
        },
        onError: (error) =>
          patchDialog({
            serverError: toApiErrorMessage(error),
            conflicts: null,
          }),
      }
    );

  const onSave = async () => {
    if (!dialog) return;
    const errors = validateRoomBlockForm(dialog.form);
    if (Object.keys(errors).length > 0) return patchDialog({ errors });
    patchDialog({ checking: true, serverError: null });
    try {
      const conflicts = await checkConflicts.mutateAsync(
        toRoomBlockRequest(dialog.form)
      );
      if (conflicts.length > 0)
        return patchDialog({ conflicts, checking: false });
      patchDialog({ checking: false });
      submit(dialog);
    } catch (error) {
      patchDialog({ checking: false, serverError: toApiErrorMessage(error) });
    }
  };

  return {
    status: (query.isPending
      ? 'loading'
      : query.isError
        ? 'error'
        : 'ready') as 'loading' | 'error' | 'ready',
    errorMessage: query.isError ? toApiErrorMessage(query.error) : null,
    onRetry: () => void query.refetch(),
    rows: blocks.map(toRoomBlockRow),
    onAdd: () =>
      setDialog({
        id: null,
        form: emptyRoomBlockForm(today),
        errors: {},
        serverError: null,
        conflicts: null,
        checking: false,
      }),
    onEdit: (id: string) => {
      const block = blocks.find((b) => b.id === id);
      if (block)
        setDialog({
          id,
          form: toRoomBlockForm(block),
          errors: {},
          serverError: null,
          conflicts: null,
          checking: false,
        });
    },
    onDelete: (id: string) => setDeleteId(id),
    onSkip: (id: string) => setSkipState({ id, date: today }),
    dialog: {
      isOpen: dialog !== null,
      isEdit: dialog?.id != null,
      form: dialog?.form ?? emptyRoomBlockForm(today),
      errors: dialog?.errors ?? {},
      serverError: dialog?.serverError ?? null,
      isBusy: save.isPending || (dialog?.checking ?? false),
      onChange: (patch: Partial<RoomBlockForm>) =>
        setDialog((d) =>
          d ? { ...d, form: { ...d.form, ...patch }, errors: {} } : d
        ),
      onToggleWeekday: (day: number) =>
        setDialog((d) => {
          if (!d) return d;
          const has = d.form.weekdays.includes(day);
          const weekdays = has
            ? d.form.weekdays.filter((x) => x !== day)
            : [...d.form.weekdays, day];
          return { ...d, form: { ...d.form, weekdays }, errors: {} };
        }),
      onSave: () => void onSave(),
      onClose: () => setDialog(null),
    },
    conflict: {
      items: dialog?.conflicts ?? [],
      isOpen: (dialog?.conflicts?.length ?? 0) > 0,
      isSaving: save.isPending,
      onCancelReservations: () => dialog && submit(dialog, 'CANCEL'),
      onKeepReservations: () => dialog && submit(dialog, 'KEEP'),
      onBack: () => patchDialog({ conflicts: null }),
    },
    deleteConfirm: {
      isOpen: deleteTarget !== null,
      description: deleteTarget
        ? `${deleteTarget.title} — ${MSG_BLOCKS.DELETE_DESC}`
        : null,
      isLoading: remove.isPending,
      onConfirm: () => {
        if (!deleteId) return;
        remove.mutate(deleteId, {
          onSuccess: () => snackbar.success(MSG_BLOCKS.DELETED),
          onError: (error) => snackbar.error(toApiErrorMessage(error)),
          onSettled: () => setDeleteId(null),
        });
      },
      onCancel: () => setDeleteId(null),
    },
    skipDialog: {
      isOpen: skipTarget !== null,
      title: skipTarget?.title ?? '',
      date: skipState?.date ?? today,
      min: skipTarget?.startDate ?? today,
      max: skipTarget?.endDate ?? today,
      isBusy: skip.isPending,
      onDateChange: (date: string) =>
        setSkipState((s) => (s ? { ...s, date } : s)),
      onConfirm: () => {
        if (!skipState) return;
        skip.mutate(skipState, {
          onSuccess: () => {
            setSkipState(null);
            snackbar.success(MSG_BLOCKS.SKIPPED);
          },
          onError: (error) => snackbar.error(toApiErrorMessage(error)),
        });
      },
      onClose: () => setSkipState(null),
    },
  };
}

export type RoomBlocksViewModel = ReturnType<typeof useRoomBlocksViewModel>;
