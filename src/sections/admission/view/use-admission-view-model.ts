'use client';

// ----------------------------------------------------------------------
// SCR-D13 입장 체크 ViewModel(FN-36). JSX 없음.
// - 회차: `?showId=` → 기기에 기억한 회차 → 지금과 가장 가까운 회차. 고르면 주소·기억을 함께 바꾼다(검색어 비움).
//   "그 회차로 이동"(§6.1a)은 검색어를 유지한다.
// - 검색: 입력 즉시 화면에서 거르고, 서버 q 는 300ms 디바운스(S23).
// - 입장 처리: 낙관 표시(queries onMutate) · 그 행 버튼 잠금 · 성공하면 응답으로 맞추고 현황 즉시 반영.
//   409 → 정본 스낵바 + 즉시 재조회, 네트워크·5xx → 상단 배너, 그 밖 → 서버 문구 스낵바.
// - 화면 읽기: 10초 폴링은 읽지 않고, 사용자 처리 결과만 announcement(aria-live)로 알린다(designer §13.5 #10).
// ----------------------------------------------------------------------
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  AdmissionResult,
  AdmissionSummary,
} from '@/src/api/admission-mapper';
import {
  useAdmissionBoard,
  useAdmissionPriceTiers,
  useAdmissionShows,
  useChangeAdmission,
  useConfirmAndAdmit,
  useCreateOnsiteReservation,
  usePendingAdmissionIds,
  useRefetchAdmissionBoards,
} from '@/src/api/admission-queries';
import type { ManualReservationFormInput } from '@/src/api/reservation-mapper';
import { paths } from '@/app/paths';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { classifyAdmissionError } from '@/src/sections/admission/utils/admission-error';
import {
  depositorNameOf,
  formatAmount,
  linesOf,
  tiersAriaOf,
  toAdmissionRowModel,
} from '@/src/sections/admission/utils/admission-row';
import {
  filterAdmissionItems,
  toSearchCode,
  toServerQuery,
} from '@/src/sections/admission/utils/admission-search';
import {
  formatKstClock,
  formatShowWhen,
  pickShowId,
} from '@/src/sections/admission/utils/admission-show';
import { MSG_BOOKING } from '@/src/shared/messages/booking';
import { MSG_D13 } from '@/src/shared/messages/d13';
import { useAdmissionStore } from '@/src/stores/admission-store';
import { RESERVATION_STATUS_LABEL } from '@/src/types/codes';
import { toApiErrorMessage } from '@/src/utils/api-error-message';
import { todayKst } from '@/src/utils/kst-date-format';
import { useOnlineStatus } from '@/src/hooks/use-online-status';

const SEARCH_DEBOUNCE_MS = 300;
const FLASH_MS = 1500;

export type AdmissionListState =
  'loading' | 'error' | 'rows' | 'empty' | 'no-result' | 'other-show';

interface PayTarget {
  id: string;
  admit: number;
}

export function useAdmissionViewModel() {
  const router = useRouter();
  const requestedShowId = useSearchParams().get('showId');
  const snackbar = useAppSnackbar();
  const storedShowId = useAdmissionStore((s) => s.selectedShowId);
  const isNumericKeypad = useAdmissionStore((s) => s.isNumericKeypad);
  const rememberShow = useAdmissionStore((s) => s.selectShow);
  const toggleKeypad = useAdmissionStore((s) => s.toggleKeypad);

  // 기억한 회차를 불러온 뒤에 회차를 고른다(SSR 과 첫 화면을 맞추려고 skipHydration)
  const [clock, setClock] = useState<{ now: number; from: string } | null>(
    null
  );
  useEffect(() => {
    void Promise.resolve(useAdmissionStore.persist.rehydrate()).then(() =>
      setClock({ now: Date.now(), from: todayKst() })
    );
  }, []);

  const [search, setSearch] = useState('');
  const [serverQuery, setServerQuery] = useState('');
  useEffect(() => {
    const next = toServerQuery(search);
    const timer = setTimeout(() => setServerQuery(next), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const showsQuery = useAdmissionShows(clock?.from ?? null);
  const shows = useMemo(() => showsQuery.data ?? [], [showsQuery.data]);
  const showId = clock
    ? pickShowId(shows, {
        requested: requestedShowId,
        stored: storedShowId,
        now: clock.now,
      })
    : null;
  const show = shows.find((s) => s.id === showId) ?? null;

  const boardQuery = useAdmissionBoard(showId, serverQuery);
  const board = boardQuery.data ?? null;
  const busyIds = usePendingAdmissionIds();
  const changeAdmission = useChangeAdmission();
  const confirmAdmit = useConfirmAndAdmit();
  const refetchBoards = useRefetchAdmissionBoards();
  const createOnsite = useCreateOnsiteReservation();

  const [flashId, setFlashId] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    []
  );
  const [announcement, setAnnouncement] = useState('');
  const [isMutationOffline, setIsMutationOffline] = useState(false);
  const isOnline = useOnlineStatus();
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null);
  const [isOnsiteOpen, setIsOnsiteOpen] = useState(false);
  const [onsiteError, setOnsiteError] = useState<string | null>(null);
  // 현장 등록 Dialog 가 열릴 때 등급이 이미 있게 미리 받는다(Dialog 는 처음 그릴 때 입력 방식을 정한다)
  const tiersQuery = useAdmissionPriceTiers(show?.performanceId ?? null, true);

  const items = useMemo(
    () => filterAdmissionItems(board?.items ?? [], search),
    [board, search]
  );
  const rows = items.map((item) =>
    toAdmissionRowModel(item, { busyIds, flashId })
  );

  // 다른 회차 안내(§6.1a) — 서버가 이 검색어로 답한 뒤 0건일 때만
  const searchCode = toSearchCode(search);
  const answeredForCode =
    board !== null &&
    !boardQuery.isPlaceholderData &&
    searchCode !== null &&
    serverQuery === searchCode &&
    items.length === 0;
  const otherMatches = answeredForCode ? (board?.otherShowMatches ?? []) : [];

  // R1-001: 실제 오프라인(navigator.onLine)도 바로 배너 — 조회·처리 실패를 기다리지 않는다
  const isOffline = !isOnline || isMutationOffline || boardQuery.isError;

  let listState: AdmissionListState;
  if (!board) listState = boardQuery.isError ? 'error' : 'loading';
  else if (items.length > 0) listState = 'rows';
  else if (otherMatches.length > 0) listState = 'other-show';
  else listState = search.trim() ? 'no-result' : 'empty';

  const flash = (id: string) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlashId(id);
    flashTimer.current = setTimeout(() => setFlashId(null), FLASH_MS);
  };

  const announce = (summary: AdmissionSummary) =>
    setAnnouncement(
      MSG_D13.STAT_ANNOUNCE(summary.admittedCount, summary.confirmedQty)
    );

  const handleSuccess = (result: AdmissionResult, message: string) => {
    setIsMutationOffline(false);
    flash(result.item.id);
    announce(result.summary);
    snackbar.success(message);
  };

  const handleError = (error: unknown) => {
    const kind = classifyAdmissionError(error);
    if (kind === 'conflict') {
      snackbar.error(MSG_D13.CONFLICT);
      if (showId) void refetchBoards(showId);
    } else if (kind === 'offline') setIsMutationOffline(true);
    else snackbar.error(toApiErrorMessage(error));
  };

  const findItem = (id: string) =>
    board?.items.find((item) => item.id === id) ?? null;

  const runDelta = (id: string, toDelta: (remaining: number) => number) => {
    const item = findItem(id);
    if (!item || !showId || busyIds.includes(id)) return;
    // R1-001: 오프라인이면 낙관 표시 없이 배너만(요청을 만들지 않는다 — 나중에 몰래 전송되지 않게)
    if (!isOnline) {
      setIsMutationOffline(true);
      return;
    }
    const delta = toDelta(item.quantity - item.admittedCount);
    if (delta === 0) return;
    changeAdmission.mutate(
      { showId, item, delta },
      {
        onSuccess: (result) =>
          handleSuccess(
            result,
            delta > 0
              ? MSG_D13.SNACK_ADMIT(item.bookerName, delta)
              : MSG_D13.SNACK_UNDO(item.bookerName)
          ),
        onError: handleError,
      }
    );
  };

  const payItem = payTarget ? findItem(payTarget.id) : null;
  const handleConfirmPay = () => {
    if (!payTarget || !payItem || !showId) return;
    if (!isOnline) {
      setIsMutationOffline(true);
      return;
    }
    const admit = payTarget.admit;
    setPayTarget(null);
    confirmAdmit.mutate(
      { showId, item: payItem, admit },
      {
        onSuccess: (result) =>
          handleSuccess(result, MSG_D13.SNACK_ADMIT(payItem.bookerName, admit)),
        onError: handleError,
      }
    );
  };

  const goToShow = (id: string, keepSearch: boolean) => {
    rememberShow(id);
    if (!keepSearch) setSearch('');
    router.replace(paths.admissionShow(id), { scroll: false });
  };

  const handleSubmitOnsite = (input: ManualReservationFormInput) => {
    setOnsiteError(null);
    createOnsite.mutate(input, {
      onSuccess: (created) => {
        setIsOnsiteOpen(false);
        flash(created.id);
        snackbar.success(MSG_D13.SNACK_ONSITE(created.bookerName));
      },
      onError: (error) => setOnsiteError(toApiErrorMessage(error)),
    });
  };

  const summary = board?.summary ?? null;
  const when = show ? formatShowWhen(show.showDate, show.startTime) : '';
  const showTitleOf = (id: string) =>
    shows.find((s) => s.id === id)?.performanceTitle ?? '';

  return {
    /** 명단 PDF 저장(오프라인 대비) 대상 회차 */
    printShowId: showId,
    // 회차
    isShowsLoading: !clock || showsQuery.isPending,
    isShowsError: showsQuery.isError,
    showsErrorMessage: showsQuery.isError
      ? toApiErrorMessage(showsQuery.error)
      : '',
    onRetryShows: () => void showsQuery.refetch(),
    hasShows: shows.length > 0,
    showChips: shows.map((s) => ({
      id: s.id,
      label: MSG_D13.SHOW_LABEL(
        s.performanceTitle,
        formatShowWhen(s.showDate, s.startTime)
      ),
      isSelected: s.id === showId,
    })),
    onSelectShow: (id: string) => goToShow(id, false),
    showLabel: show ? MSG_D13.SHOW_LABEL(show.performanceTitle, when) : '',
    // 현황
    summary: summary
      ? {
          admitted: summary.admittedCount,
          confirmed: summary.confirmedQty,
          notAdmitted: summary.notAdmittedQty,
          pendingCount: summary.pendingCount,
          progress:
            summary.confirmedQty > 0
              ? Math.min(
                  100,
                  Math.round(
                    (summary.admittedCount / summary.confirmedQty) * 100
                  )
                )
              : 0,
        }
      : null,
    freshness: {
      isStale: isOffline && boardQuery.dataUpdatedAt > 0,
      text:
        isOffline && boardQuery.dataUpdatedAt > 0
          ? MSG_D13.STALE(formatKstClock(boardQuery.dataUpdatedAt))
          : MSG_D13.FRESH,
    },
    isRefreshing: boardQuery.isFetching,
    onRefresh: () => {
      setIsMutationOffline(false);
      if (showId) void refetchBoards(showId);
    },
    announcement,
    isOffline,
    // 검색
    search,
    onSearchChange: setSearch,
    onSearchClear: () => setSearch(''),
    isNumericKeypad,
    onToggleKeypad: toggleKeypad,
    emptyMessage: listState === 'empty' ? MSG_D13.EMPTY : MSG_D13.NO_RESULT,
    // 명단
    listState,
    list: {
      rows,
      resultText:
        search.trim() && rows.length > 0 ? MSG_D13.RESULT(rows.length) : null,
    },
    rowHandlers: {
      onPlus: (id: string) => runDelta(id, () => 1),
      onAll: (id: string) => runDelta(id, (remaining) => remaining),
      onMinus: (id: string) => runDelta(id, () => -1),
      onPay: (id: string) => {
        const item = findItem(id);
        if (item && !busyIds.includes(id))
          setPayTarget({ id, admit: item.quantity });
      },
    },
    otherShow: {
      subtitle: MSG_D13.OTHER_SUB(when),
      matches: otherMatches.map((m) => ({
        id: m.reservationId,
        bookerName: m.bookerName,
        status: m.status,
        meta: MSG_D13.OTHER_META(
          [
            // 같은 예매번호로 찾은 결과라 번호 = 검색어(서버는 code 를 주지 않는다)
            searchCode ? MSG_D13.META_CODE(searchCode) : '',
            m.performanceTitle || showTitleOf(m.showId),
            formatShowWhen(m.showDate, m.startTime),
            `${m.quantity}${MSG_BOOKING.TICKET_UNIT}`,
            RESERVATION_STATUS_LABEL[m.status],
          ].filter(Boolean)
        ),
        showId: m.showId,
        canMove: shows.some((s) => s.id === m.showId),
      })),
    },
    onMoveToShow: (id: string) => goToShow(id, true),
    // 입금 확인 + 입장 시트
    sheet:
      payTarget && payItem
        ? {
            title: MSG_D13.SHEET_TITLE(formatAmount(payItem.amount)),
            lines: linesOf(payItem),
            tiersAria: tiersAriaOf(linesOf(payItem)),
            bookerText: MSG_D13.SHEET_BOOKER_VALUE(
              payItem.bookerName,
              payItem.code,
              payItem.quantity
            ),
            depositorText: depositorNameOf(payItem),
            admit: payTarget.admit,
            rangeText: MSG_D13.SHEET_ADMIT_RANGE(payItem.quantity),
            canDecrease: payTarget.admit > 1,
            canIncrease: payTarget.admit < payItem.quantity,
          }
        : null,
    onSheetDecrease: () =>
      setPayTarget((t) => (t ? { ...t, admit: Math.max(1, t.admit - 1) } : t)),
    onSheetIncrease: () =>
      setPayTarget((t) =>
        t && payItem
          ? { ...t, admit: Math.min(payItem.quantity, t.admit + 1) }
          : t
      ),
    onSheetConfirm: handleConfirmPay,
    onSheetClose: () => setPayTarget(null),
    // 현장 예매 등록
    onsite: {
      open: isOnsiteOpen,
      showOptions: shows.map((s) => ({
        id: s.id,
        label: MSG_D13.SHOW_LABEL(
          s.performanceTitle,
          formatShowWhen(s.showDate, s.startTime)
        ),
        remainingSeats: s.remainingSeats,
      })),
      fixedShowId: showId,
      tierOptions: tiersQuery.data ?? [],
      isSubmitting: createOnsite.isPending,
      errorMessage: onsiteError,
    },
    onOpenOnsite: () => {
      setOnsiteError(null);
      setIsOnsiteOpen(true);
    },
    onCloseOnsite: () => setIsOnsiteOpen(false),
    onSubmitOnsite: handleSubmitOnsite,
  };
}

export type AdmissionViewModel = ReturnType<typeof useAdmissionViewModel>;
