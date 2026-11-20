'use client';

// ----------------------------------------------------------------------
// SCR-D12 행 처리 ViewModel(FN-33·34) — JSX 없음.
// - 입금 확인: 확인창 없이 즉시 + 되돌리기 스낵바(되돌리기 = unconfirm, 응답 version 으로).
// - 확인 취소·되살리기: 즉시 + 스낵바. 취소: 사유 Dialog. 메모·등급 수정: Dialog(version 포함).
// - 수동 등록(공용 Dialog) · 기한 지난 일괄 취소(확인창).
// - RSV_007·008 은 정본 스낵바 "다른 스태프가 먼저 처리했습니다. 목록을 새로 불러왔습니다." + 재조회(뮤테이션 onSettled 무효화),
//   Dialog 는 닫는다. 그 밖 오류(RSV_003·009·011·012 등)는 서버 message(Dialog 안 또는 스낵바).
// ----------------------------------------------------------------------
import { useState } from 'react';

import type { ReservationTransition } from '@/src/api/reservation';
import type {
  ManualReservationFormInput,
  Reservation,
  ReservationLinesFormInput,
} from '@/src/api/reservation-mapper';
import {
  useCancelOverdueReservations,
  useCancelReservation,
  useCreateManualReservation,
  useSaveReservationItems,
  useSaveReservationMemo,
  useTransitionReservation,
} from '@/src/api/reservation-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { isConflictError } from '@/src/sections/reservations/utils/is-conflict-error';
import { MSG_D12 } from '@/src/shared/messages/d12';
import type { CancelReason } from '@/src/types/booking';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

type DialogKind = 'cancel' | 'memo' | 'items';

interface OpenDialog {
  kind: DialogKind;
  reservation: Reservation;
}

export function useReservationActions(
  findReservation: (id: string) => Reservation | null,
  performanceId: string | null
) {
  const snackbar = useAppSnackbar();
  const transition = useTransitionReservation();
  const cancel = useCancelReservation();
  const memo = useSaveReservationMemo();
  const items = useSaveReservationItems();
  const overdue = useCancelOverdueReservations();
  const manual = useCreateManualReservation();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [undoTarget, setUndoTarget] = useState<Reservation | null>(null);
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [isOverdueOpen, setIsOverdueOpen] = useState(false);

  /** 실패 공통 — 충돌이면 정본 스낵바 + Dialog 닫기, 아니면 inDialog 면 Dialog 안 문구 */
  const handleError = (error: unknown, inDialog: boolean) => {
    if (isConflictError(error)) {
      setDialog(null);
      snackbar.error(MSG_D12.CONFLICT);
      return;
    }
    if (inDialog) setDialogError(toApiErrorMessage(error));
    else snackbar.error(toApiErrorMessage(error));
  };

  const runTransition = (
    target: Reservation,
    kind: ReservationTransition,
    onDone: (updated: Reservation) => void
  ) => {
    setBusyId(target.id);
    transition.mutate(
      { id: target.id, kind, version: target.version },
      {
        onSuccess: onDone,
        onError: (error) => handleError(error, false),
        onSettled: () => setBusyId(null),
      }
    );
  };

  const withTarget = (id: string, run: (target: Reservation) => void) => {
    const target = findReservation(id);
    if (target) run(target);
  };

  const openDialog = (kind: DialogKind, id: string) =>
    withTarget(id, (reservation) => {
      setDialogError(null);
      setDialog({ kind, reservation });
    });

  const dialogTarget = (kind: DialogKind) =>
    dialog?.kind === kind ? dialog.reservation : null;

  return {
    busyId,
    undoCode: undoTarget?.code ?? null,
    cancelTarget: dialogTarget('cancel'),
    memoTarget: dialogTarget('memo'),
    itemsTarget: dialogTarget('items'),
    dialogError,
    isDialogSubmitting: cancel.isPending || memo.isPending || items.isPending,
    isManualOpen,
    manualError,
    isManualSubmitting: manual.isPending,
    isOverdueOpen,
    isOverdueSubmitting: overdue.isPending,

    onConfirm: (id: string) =>
      withTarget(id, (target) =>
        runTransition(target, 'confirm', (updated) => setUndoTarget(updated))
      ),
    onUndo: () => {
      const target = undoTarget;
      setUndoTarget(null);
      if (!target) return;
      runTransition(target, 'unconfirm', () =>
        snackbar.success(MSG_D12.UNDONE(target.code))
      );
    },
    onCloseUndo: () => setUndoTarget(null),
    onUnconfirm: (id: string) =>
      withTarget(id, (target) =>
        runTransition(target, 'unconfirm', () =>
          snackbar.success(MSG_D12.UNCONFIRMED(target.code))
        )
      ),
    onRestore: (id: string) =>
      withTarget(id, (target) =>
        runTransition(target, 'restore', () =>
          snackbar.success(MSG_D12.RESTORED(target.code))
        )
      ),
    onRequestCancel: (id: string) => openDialog('cancel', id),
    onRequestMemo: (id: string) => openDialog('memo', id),
    onRequestItems: (id: string) => openDialog('items', id),
    onCloseDialog: () => setDialog(null),
    onSubmitCancel: (reason: CancelReason) => {
      const target = dialog?.reservation;
      if (!target) return;
      cancel.mutate(
        { id: target.id, version: target.version, reason },
        {
          onSuccess: () => {
            setDialog(null);
            snackbar.success(MSG_D12.CANCELLED(target.code));
          },
          onError: (error) => handleError(error, true),
        }
      );
    },
    onSubmitMemo: (value: string) => {
      const target = dialog?.reservation;
      if (!target) return;
      memo.mutate(
        { id: target.id, memo: value, version: target.version },
        {
          onSuccess: () => setDialog(null),
          onError: (error) => handleError(error, true),
        }
      );
    },
    onSubmitItems: (input: ReservationLinesFormInput) => {
      const target = dialog?.reservation;
      if (!target) return;
      items.mutate(
        { id: target.id, input, version: target.version },
        {
          onSuccess: () => {
            setDialog(null);
            snackbar.success(MSG_D12.ITEMS_SAVED(target.code));
          },
          onError: (error) => handleError(error, true),
        }
      );
    },
    onOpenManual: () => {
      setManualError(null);
      setIsManualOpen(true);
    },
    onCloseManual: () => setIsManualOpen(false),
    onSubmitManual: (input: ManualReservationFormInput) =>
      manual.mutate(input, {
        onSuccess: (created) => {
          setIsManualOpen(false);
          snackbar.success(MSG_D12.REGISTERED(created.code));
        },
        onError: (error) => setManualError(toApiErrorMessage(error)),
      }),
    onOpenOverdue: () => setIsOverdueOpen(true),
    onCloseOverdue: () => setIsOverdueOpen(false),
    onSubmitOverdue: () => {
      if (!performanceId) return;
      overdue.mutate(
        { performanceId, showId: null },
        {
          onSuccess: (count) => {
            setIsOverdueOpen(false);
            snackbar.success(MSG_D12.OVERDUE_DONE(count));
          },
          onError: (error) => {
            setIsOverdueOpen(false);
            snackbar.error(toApiErrorMessage(error));
          },
        }
      );
    },
  };
}

export type ReservationActions = ReturnType<typeof useReservationActions>;
