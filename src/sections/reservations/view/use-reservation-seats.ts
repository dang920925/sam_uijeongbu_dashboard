'use client';

// ----------------------------------------------------------------------
// D12 좌석(U35) ViewModel — JSX 없음.
// - 좌석 변경: 행 "좌석 변경" → 그 회차 지도(이 예매 좌석이 처음 고른 값) → 매수만큼 → PUT { seatIds, version }.
//   409 SEAT_001(먼저 잡힌 좌석)은 그 좌석을 빼고 지도를 다시 받는다(onSettled 무효화), RSV_007 은 문구만.
// - 좌석 현황: 회차 pill 을 고르면 "좌석 현황" → 지도. 예매 완료 칸 → "B3 — 이름" → "이 예매 찾기"(검색어).
// - 수동 등록 좌석: 고른 회차의 지도를 Dialog 에 넘긴다(회차가 바뀌면 다시 받는다).
// ----------------------------------------------------------------------
import { useState } from 'react';

import type { Reservation } from '@/src/api/reservation-mapper';
import {
  useAdminSeatMap,
  useReplaceReservationSeats,
} from '@/src/api/seat-map-queries';
import type { ManualReservationSeatPicker } from '@/src/components/manual-reservation-dialog';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { ApiError } from '@/src/lib/api-client';
import type { ReservationSeatsDialogProps } from '@/src/sections/reservations/components/reservation-seats-dialog';
import type { SeatStatusDialogProps } from '@/src/sections/reservations/components/seat-status-dialog';
import { MSG_SEAT } from '@/src/shared/messages/seat';
import { toApiErrorMessage } from '@/src/utils/api-error-message';
import {
  findSeatCell,
  pickedLabels,
  resolvePicked,
  toggleSeatPick,
  toPickerRows,
  toStatusRows,
} from '@/src/utils/seat-grid-view';

interface Args {
  enabled: boolean;
  findReservation: (id: string) => Reservation | null;
  /** 회차 id → "12.12 (토) 14:00" */
  showLabelOf: (showId: string) => string;
  /** 현황 대상 회차(회차 pill — 전체면 null) */
  statusShowId: string | null;
  /** 수동 등록 기본 회차(첫 회차) */
  defaultManualShowId: string | null;
  onFindBooker: (name: string) => void;
}

export function useReservationSeats({
  enabled,
  findReservation,
  showLabelOf,
  statusShowId,
  defaultManualShowId,
  onFindBooker,
}: Args) {
  const snackbar = useAppSnackbar();
  const replace = useReplaceReservationSeats();

  // ── 좌석 변경 ──
  const [target, setTarget] = useState<Reservation | null>(null);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  const changeQuery = useAdminSeatMap(target?.showId ?? null);
  const changeMap = changeQuery.data ?? null;
  const ownId = target?.id ?? null;
  const initialPicked = (changeMap?.rows ?? []).flatMap((row) =>
    row.cells
      .filter((cell) => cell.seatId && cell.reservationId === ownId)
      .map((cell) => cell.seatId as string)
  );
  const quantity = target?.quantity ?? 0;
  const currentPicked = resolvePicked(
    changeMap,
    picked ?? initialPicked,
    quantity,
    ownId
  );
  const closeChange = () => {
    setTarget(null);
    setPicked(null);
    setChangeError(null);
  };

  const change: ReservationSeatsDialogProps = {
    open: target !== null,
    title: MSG_SEAT.CHANGE_TITLE(target?.bookerName ?? ''),
    help: MSG_SEAT.CHANGE_HELP(quantity),
    status: changeQuery.isPending
      ? 'loading'
      : changeQuery.isError
        ? 'error'
        : changeMap
          ? 'ready'
          : 'empty',
    rows: changeMap
      ? toPickerRows(changeMap, currentPicked, quantity, ownId)
      : [],
    pickedText: MSG_SEAT.PICKED(
      pickedLabels(changeMap, currentPicked),
      currentPicked.length,
      quantity
    ),
    canSubmit: currentPicked.length === quantity && quantity > 0,
    isSubmitting: replace.isPending,
    errorMessage: changeError,
    onCellClick: (key) => {
      const cell = findSeatCell(changeMap, key);
      if (!cell?.seatId) return;
      setPicked(toggleSeatPick(currentPicked, cell.seatId, quantity));
      setChangeError(null);
    },
    onSubmit: () => {
      if (!target || replace.isPending) return;
      if (currentPicked.length !== quantity) {
        setChangeError(MSG_SEAT.CHANGE_NEED(quantity));
        return;
      }
      replace.mutate(
        { id: target.id, seatIds: currentPicked, version: target.version },
        {
          onSuccess: () => {
            snackbar.success(MSG_SEAT.CHANGE_SAVED);
            closeChange();
          },
          onError: (error) => {
            setChangeError(toApiErrorMessage(error));
            if (error instanceof ApiError && error.payload?.seatIds) {
              const taken = new Set(error.payload.seatIds);
              setPicked(currentPicked.filter((id) => !taken.has(id)));
            }
          },
        }
      );
    },
    onClose: closeChange,
    onRetry: () => void changeQuery.refetch(),
  };

  // ── 좌석 현황 ──
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const statusQuery = useAdminSeatMap(statusOpen ? statusShowId : null);
  const statusMap = statusQuery.data ?? null;
  const statusCell = statusKey ? findSeatCell(statusMap, statusKey) : null;
  const closeStatus = () => {
    setStatusOpen(false);
    setStatusKey(null);
  };
  const status: SeatStatusDialogProps = {
    open: statusOpen && statusShowId !== null,
    title: MSG_SEAT.STATUS_TITLE(statusShowId ? showLabelOf(statusShowId) : ''),
    status: statusQuery.isPending
      ? 'loading'
      : statusQuery.isError
        ? 'error'
        : statusMap
          ? 'ready'
          : 'empty',
    rows: statusMap ? toStatusRows(statusMap) : [],
    remainingText: statusMap
      ? MSG_SEAT.REMAINING(statusMap.remaining, statusMap.total)
      : '',
    selectedText:
      statusCell?.sold && statusCell.bookerName
        ? MSG_SEAT.STATUS_SELECTED(statusCell.seatLabel, statusCell.bookerName)
        : null,
    onCellClick: setStatusKey,
    onFind: () => {
      if (statusCell?.bookerName) onFindBooker(statusCell.bookerName);
      closeStatus();
    },
    onClose: closeStatus,
    onRetry: () => void statusQuery.refetch(),
  };

  // ── 수동 등록 좌석 ──
  const [manualShowId, setManualShowId] = useState<string | null>(null);
  const manualQuery = useAdminSeatMap(
    enabled ? (manualShowId ?? defaultManualShowId) : null
  );
  const manualSeatPicker: ManualReservationSeatPicker | null = enabled
    ? {
        status: manualQuery.isPending
          ? 'loading'
          : manualQuery.isError
            ? 'error'
            : 'ready',
        map: manualQuery.data ?? null,
        onShowChange: setManualShowId,
        onRetry: () => void manualQuery.refetch(),
      }
    : null;

  return {
    change,
    status,
    manualSeatPicker,
    resetManualShow: () => setManualShowId(null),
    canOpenStatus: enabled && statusShowId !== null,
    onOpenStatus: () => setStatusOpen(true),
    onRequestSeats: enabled
      ? (id: string) => {
          const r = findReservation(id);
          if (!r) return;
          setTarget(r);
          setPicked(null);
          setChangeError(null);
        }
      : undefined,
  };
}
