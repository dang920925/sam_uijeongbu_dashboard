'use client';

// ----------------------------------------------------------------------
// U34 관리자 연습실 예약 목록 ViewModel — 주 이동 · 기간 조회 · 삭제(확인 뒤, 관리자는 시작 여부와 무관). JSX 없음.
// U23 캘린더 '연습실 예약' 레이어(T-SA 배포 뒤)도 같은 API(useAdminRoomReservations)를 쓴다.
// (U46) 막은 시간 발생분도 같은 표에 줄로 — 동작은 '이 날만 해제'(확인 뒤).
// ----------------------------------------------------------------------
import { useMemo, useState } from 'react';

import {
  useAdminRoomReservations,
  useDeleteAdminRoomReservation,
  useSkipRoomBlockDate,
} from '@/src/api/practice-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  addDays,
  formatWeekTitle,
  kstDateOf,
  toRoomScheduleRows,
  weekRange,
  weekStartOf,
} from '@/src/sections/room-reservations/utils/room-week';
import { MSG_ROOMS } from '@/src/shared/messages/room-reservations';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export function useRoomReservationsViewModel() {
  const snackbar = useAppSnackbar();
  const [today] = useState(() => kstDateOf(new Date()));
  const [weekStart, setWeekStart] = useState(() => weekStartOf(today));
  const range = useMemo(() => weekRange(weekStart), [weekStart]);
  const query = useAdminRoomReservations(range);
  const remove = useDeleteAdminRoomReservation();
  const skip = useSkipRoomBlockDate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [skipRowId, setSkipRowId] = useState<string | null>(null);

  const rows = toRoomScheduleRows(
    query.data ?? { reservations: [], blocks: [] },
    {
      noMemo: MSG_ROOMS.NO_MEMO,
      noAttendees: MSG_ROOMS.NO_ATTENDEES,
      blockLabel: MSG_ROOMS.BLOCK_ROW_LABEL,
      empty: MSG_ROOMS.EMPTY_VALUE,
    }
  );
  const target = rows.find((r) => r.id === deleteId) ?? null;
  const skipTarget = rows.find((r) => r.id === skipRowId) ?? null;

  return {
    weekTitle: formatWeekTitle(weekStart),
    onPrev: () => setWeekStart((w) => addDays(w, -7)),
    onNext: () => setWeekStart((w) => addDays(w, 7)),
    onToday: () => setWeekStart(weekStartOf(today)),
    status: (query.isPending
      ? 'loading'
      : query.isError
        ? 'error'
        : 'ready') as 'loading' | 'error' | 'ready',
    errorMessage: query.isError ? toApiErrorMessage(query.error) : null,
    onRetry: () => void query.refetch(),
    rows,
    onDelete: (id: string) => setDeleteId(id),
    onSkip: (id: string) => setSkipRowId(id),
    skipConfirm: {
      isOpen: skipTarget !== null,
      description: skipTarget
        ? `${skipTarget.teamName} · ${skipTarget.dateText} ${skipTarget.timeText}`
        : null,
      isLoading: skip.isPending,
      onConfirm: () => {
        if (!skipTarget?.blockId) return;
        skip.mutate(
          { id: skipTarget.blockId, date: skipTarget.date },
          {
            onSuccess: () => snackbar.success(MSG_ROOMS.BLOCK_SKIPPED),
            onError: (error) => snackbar.error(toApiErrorMessage(error)),
            onSettled: () => setSkipRowId(null),
          }
        );
      },
      onCancel: () => setSkipRowId(null),
    },
    deleteConfirm: {
      isOpen: target !== null,
      description: target
        ? MSG_ROOMS.DELETE_DESC(
            target.teamName,
            `${target.dateText} ${target.timeText}`
          )
        : null,
      isLoading: remove.isPending,
      onConfirm: () => {
        if (!deleteId) return;
        remove.mutate(deleteId, {
          onSuccess: () => snackbar.success(MSG_ROOMS.DELETED),
          onError: (error) => snackbar.error(toApiErrorMessage(error)),
          onSettled: () => setDeleteId(null),
        });
      },
      onCancel: () => setDeleteId(null),
    },
  };
}

export type RoomReservationsViewModel = ReturnType<
  typeof useRoomReservationsViewModel
>;
