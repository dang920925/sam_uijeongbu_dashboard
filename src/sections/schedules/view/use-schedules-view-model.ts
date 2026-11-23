'use client';

// ----------------------------------------------------------------------
// SCR-D08 일정 관리 ViewModel(FN-15 · U23 보강 · U29). JSX 없음.
// - 보기 월(기본)·주·목록(URL `?view`), 타입 필터는 세 보기 모두에 적용.
// - 목록 = 현행(startAt desc, 20건, 페이지). 월·주 = 보이는 범위가 걸치는 달마다 조회(use-schedule-calendar).
// - 칩·블록·아젠다 행 → 상세(md↑ 팝오버 / xs 아래 시트) → 수정·삭제·일정 취소·취소 해제.
// - 추가 기본값: 머리 버튼 = 빈 값(J-63), 월 빈 자리 = 그 날 00:00(J-19), 주 빈 칸 = 그 칸 + 1시간(J-60).
// - 저장 성공 → 저장된 일정 날짜로 이동(J-23). 삭제 실패는 확인창을 닫고 스낵바.
// - (v1.3.1) '연습실 예약' 레이어 — 기본 켜짐. 칩(`room:{id}`)을 누르면 연습실 예약 상세 → '예약 삭제'(확인 후).
// ----------------------------------------------------------------------
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';

import { useAllClasses, usePerformances } from '@/src/api/performance-queries';
import {
  useDeleteAdminRoomReservation,
  useSkipRoomBlockDate,
} from '@/src/api/practice-queries';
import { toScheduleFormInput } from '@/src/api/schedule-mapper';
import { useDeleteSchedule, useSchedules } from '@/src/api/schedule-queries';
import type { SegmentOption } from '@/src/components/segment-pill';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import type { CalendarView } from '@/src/sections/schedules/utils/calendar-nav';
import { toKstMoment } from '@/src/sections/schedules/utils/kst-calendar';
import { normalizeScheduleLink } from '@/src/sections/schedules/utils/normalize-schedule-link';
import {
  emptyAddForm,
  monthAddForm,
  weekAddForm,
} from '@/src/sections/schedules/utils/schedule-add-default';
import { toScheduleDetail } from '@/src/sections/schedules/utils/schedule-detail';
import { toScheduleRow } from '@/src/sections/schedules/utils/schedule-row';
import { isRoomEventId } from '@/src/sections/schedules/utils/room-event';
import { useScheduleCalendar } from '@/src/sections/schedules/view/use-schedule-calendar';
import { useScheduleCancel } from '@/src/sections/schedules/view/use-schedule-cancel';
import { useScheduleForm } from '@/src/sections/schedules/view/use-schedule-form';
import { MSG_D08 } from '@/src/shared/messages/d08';
import {
  SCHEDULE_TYPE_LABEL,
  SCHEDULE_TYPES,
  type ScheduleType,
} from '@/src/types/codes';
import { ADMIN_MAX_PAGE_SIZE, ADMIN_PAGE_SIZE } from '@/src/types/common';
import type { Schedule } from '@/src/types/content';
import { toApiErrorMessage as toErrorMessage } from '@/src/utils/api-error-message';

type ScheduleTypeFilter = ScheduleType | 'ALL';

const FILTER_OPTIONS: SegmentOption<ScheduleTypeFilter>[] = [
  { value: 'ALL', label: MSG_D08.FILTER_ALL },
  ...SCHEDULE_TYPES.map((type) => ({
    value: type,
    label: SCHEDULE_TYPE_LABEL[type],
  })),
];

const TYPE_OPTIONS = SCHEDULE_TYPES.map((type) => ({
  value: type,
  label: SCHEDULE_TYPE_LABEL[type],
}));

const VIEW_OPTIONS: SegmentOption<CalendarView>[] = [
  { value: 'month', label: MSG_D08.VIEW_MONTH },
  { value: 'week', label: MSG_D08.VIEW_WEEK },
  { value: 'list', label: MSG_D08.VIEW_LIST },
];
const VIEW_OPTIONS_XS = VIEW_OPTIONS.filter((o) => o.value !== 'week');

interface Anchored<T> {
  value: T;
  anchor: HTMLElement | null;
}

export function useSchedulesViewModel(today: string) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('md'));
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));
  const snackbar = useAppSnackbar();
  const [typeFilter, setTypeFilter] = useState<ScheduleTypeFilter>('ALL');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [detail, setDetail] = useState<Anchored<string> | null>(null);
  const [more, setMore] = useState<Anchored<string> | null>(null);
  /** v1.3.1 연습실 예약 레이어 — 기본 켜짐 */
  const [showRooms, setShowRooms] = useState(true);
  const [roomDetailId, setRoomDetailId] = useState<string | null>(null);
  const [roomDeleteOpen, setRoomDeleteOpen] = useState(false);
  const removeRoom = useDeleteAdminRoomReservation();
  const skipBlock = useSkipRoomBlockDate();
  const type = typeFilter === 'ALL' ? undefined : typeFilter;

  const calendar = useScheduleCalendar({ today, type, isXs, isLg, showRooms });
  const isList = calendar.view === 'list';
  const listQuery = useSchedules({ type, page, size: ADMIN_PAGE_SIZE }, isList);
  const performancesQuery = usePerformances({ size: ADMIN_MAX_PAGE_SIZE });
  const classesQuery = useAllClasses();
  const remove = useDeleteSchedule();
  const cancel = useScheduleCancel(snackbar);
  const form = useScheduleForm(snackbar, (saved) => {
    const moment = toKstMoment(saved.startAt);
    if (moment) calendar.goToDate(moment.date);
  });

  const listItems = useMemo(
    () => listQuery.data?.items ?? [],
    [listQuery.data]
  );
  const rows = useMemo(() => listItems.map(toScheduleRow), [listItems]);
  const performanceOptions = useMemo(
    () =>
      (performancesQuery.data?.items ?? []).map((p) => ({
        value: p.id,
        label: p.title,
      })),
    [performancesQuery.data]
  );
  const names = useMemo(
    () => ({
      performances: new Map(performanceOptions.map((o) => [o.value, o.label])),
      classes: new Map((classesQuery.data ?? []).map((c) => [c.id, c.name])),
    }),
    [performanceOptions, classesQuery.data]
  );

  const findSchedule = (id: string) =>
    calendar.items.find((s) => s.id === id) ??
    listItems.find((s) => s.id === id) ??
    null;
  const detailSchedule = detail ? findSchedule(detail.value) : null;
  const moreCell = more
    ? (calendar.monthWeeks.flat().find((c) => c.date === more.value) ?? null)
    : null;

  // 처리 후 마지막 쪽이 비면 앞 쪽으로 — 렌더 중 파생 상태 조정. 0건이면 totalPages 0 → 1 아래로 내리지 않는다.
  const lastPage = Math.max(1, listQuery.data?.totalPages ?? 1);
  if (listQuery.data && page > lastPage) setPage(lastPage);

  const listError = isList && listQuery.isError ? listQuery.error : null;
  const calendarError = !isList && calendar.isError ? calendar.error : null;
  const shownError = listError ?? calendarError;
  useEffect(() => {
    if (shownError) snackbar.error(toErrorMessage(shownError));
  }, [shownError, snackbar]);

  /** 상세·더보기를 닫고 schedule 로 동작 */
  const withSchedule =
    (action: (schedule: Schedule) => void) => (id: string) => {
      const schedule = findSchedule(id);
      setDetail(null);
      setMore(null);
      if (schedule) action(schedule);
    };

  const handleOpenEdit = withSchedule((schedule) => {
    const performanceIds = performancesQuery.data
      ? new Set(performancesQuery.data.items.map((p) => p.id))
      : null;
    form.open(
      schedule.id,
      normalizeScheduleLink(toScheduleFormInput(schedule), performanceIds)
    );
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (error) => {
        setDeleteTarget(null);
        snackbar.error(toErrorMessage(error));
      },
    });
  };

  const roomDetail =
    calendar.roomEvents.find((event) => event.id === roomDetailId) ?? null;

  // (U46) 막은 시간 상세의 동작은 '이 날만 해제', 팀 예약은 '예약 삭제'
  const handleConfirmRoomDelete = () => {
    if (!roomDetail?.room) return;
    const { blockId, blockDate } = roomDetail.room;
    if (blockId && blockDate) {
      skipBlock.mutate(
        { id: blockId, date: blockDate },
        {
          onSuccess: () => {
            setRoomDeleteOpen(false);
            setRoomDetailId(null);
            snackbar.success(MSG_D08.BLOCK_SKIPPED);
          },
          onError: (error) => {
            setRoomDeleteOpen(false);
            snackbar.error(toErrorMessage(error));
          },
        }
      );
      return;
    }
    removeRoom.mutate(roomDetail.room.id, {
      onSuccess: () => {
        setRoomDeleteOpen(false);
        setRoomDetailId(null);
        snackbar.success(MSG_D08.ROOM_DELETED);
      },
      onError: (error) => {
        setRoomDeleteOpen(false);
        snackbar.error(toErrorMessage(error));
      },
    });
  };

  const openDetail = (id: string, anchor: HTMLElement | null) => {
    if (isRoomEventId(id)) {
      setMore(null);
      setRoomDetailId(id);
      return;
    }
    // 더보기 팝오버 안 칩이면 더보기 단추에 붙인다(팝오버가 닫히며 칩이 사라지므로)
    setDetail({ value: id, anchor: more?.anchor ?? anchor });
    setMore(null);
  };
  const addOnDate = (date: string) => form.open(null, monthAddForm(date));
  const addAtSlot = (date: string, minutes: number) =>
    form.open(null, weekAddForm(date, minutes));
  const openMore = (date: string, anchor: HTMLElement) =>
    setMore({ value: date, anchor });

  const rowHandlers = {
    onEdit: handleOpenEdit,
    onDelete: withSchedule(setDeleteTarget),
    onCancel: withSchedule(cancel.openCancel),
    onRestore: withSchedule(cancel.openRestore),
  };

  return {
    isXs,
    calendar,
    viewOptions: isXs ? VIEW_OPTIONS_XS : VIEW_OPTIONS,
    filterOptions: FILTER_OPTIONS,
    typeFilter,
    page,
    totalPages: lastPage,
    rows,
    isLoading: listQuery.isPending,
    isError: listQuery.isError && !listQuery.data,
    errorMessage: shownError ? toErrorMessage(shownError) : '',
    isCalendarError: calendar.isError,
    form,
    typeOptions: TYPE_OPTIONS,
    performanceOptions,
    isDeleteOpen: deleteTarget !== null,
    isDeleting: remove.isPending,
    cancel,
    detail:
      detail && detailSchedule ? toScheduleDetail(detailSchedule, names) : null,
    detailAnchor: detail?.anchor ?? null,
    moreCell,
    moreAnchor: more?.anchor ?? null,
    rowHandlers,
    onFilterChange: (next: ScheduleTypeFilter) => {
      setTypeFilter(next);
      setPage(1);
    },
    onViewChange: (next: CalendarView) => {
      setPage(1);
      calendar.onViewChange(next);
    },
    onPageChange: setPage,
    onRetry: () => void (isList ? listQuery.refetch() : calendar.refetch()),
    onOpenAdd: () => form.open(null, emptyAddForm()),
    onOpenDetail: openDetail,
    onCloseDetail: () => setDetail(null),
    onCloseMore: () => setMore(null),
    /** 보기별 본문 props(Container 가 그대로 펼친다) */
    monthGridProps: {
      ariaLabel: calendar.rangeTitle,
      weeks: calendar.monthWeeks,
      isPending: calendar.isPending,
      activeMoreDate: more?.value ?? null,
      onAdd: addOnDate,
      onOpenEvent: openDetail,
      onOpenMore: openMore,
    },
    weekGridProps: {
      rangeKey: calendar.rangeKey,
      isPending: calendar.isPending,
      days: calendar.weekDays,
      scrollMinutes: calendar.weekScrollMinutes,
      nowMinutes: calendar.nowMinutes,
      onAdd: addAtSlot,
      onOpenEvent: openDetail,
    },
    agendaProps: { days: calendar.agendaDays, onOpenEvent: openDetail },
    frameProps: {
      rangeKey: calendar.rangeKey,
      direction: calendar.direction,
      isFetching: calendar.isFetching,
    },
    showRooms,
    onToggleRooms: () => setShowRooms((value) => !value),
    /** 목록 보기 아래 연습실 예약(레이어 꺼짐이면 null) */
    roomListEvents: showRooms && isList ? calendar.roomEvents : null,
    roomDetail,
    isRoomDeleteOpen: roomDeleteOpen,
    isRoomDeleting: removeRoom.isPending || skipBlock.isPending,
    /** (U46) 막은 시간 상세면 확인 창이 '이 날만 해제' */
    isRoomBlock: Boolean(roomDetail?.room?.blockId),
    onCloseRoomDetail: () => setRoomDetailId(null),
    onRoomDelete: () => setRoomDeleteOpen(true),
    onConfirmRoomDelete: handleConfirmRoomDelete,
    onCancelRoomDelete: () => setRoomDeleteOpen(false),
    onConfirmDelete: handleConfirmDelete,
    onCancelDelete: () => setDeleteTarget(null),
  };
}

export type SchedulesViewModel = ReturnType<typeof useSchedulesViewModel>;
