'use client';

// ----------------------------------------------------------------------
// SCR-D12 예매 관리 ViewModel(FN-33·34·35) — JSX 없음.
// - 공연: 사용자가 고른 것 > URL ?performanceId > 오늘 이후 첫 회차의 공연(GET /admin/shows) > 첫 공연(지휘자 결정).
// - 목록: 회차·상태·기한 지남만·검색(300ms 디바운스) → GET /admin/reservations(접수 desc, 20건씩).
// - §6.1a 정확 일치: URL ?q= 또는 검색어가 4자리 예매번호와 같으면 그 행을 맨 위 + 강조 + 상세 드로어(검색어마다 1번).
// - 헤더 빠른 검색이 다른 예매로 다시 들어오면(URL 이 바뀌면) 공연·검색어를 URL 값으로 다시 맞춘다.
// ----------------------------------------------------------------------
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { usePerformances } from '@/src/api/performance-queries';
import type { Reservation } from '@/src/api/reservation-mapper';
import {
  useNearestShowPerformanceId,
  useReservationSummary,
  useReservationTierOptions,
  useReservations,
} from '@/src/api/reservation-queries';
import { paths } from '@/app/paths';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { clampPage } from '@/src/sections/applications/utils/clamp-page';
import { useInviteLinks } from '@/src/sections/reservations/view/use-invite-links';
import { useReservationActions } from '@/src/sections/reservations/view/use-reservation-actions';
import { pickPerformanceId } from '@/src/sections/reservations/utils/pick-performance';
import {
  orderWithExactMatch,
  toReservationRow,
} from '@/src/sections/reservations/utils/reservation-row';
import {
  toInviterSummaryTable,
  toReservationKpis,
  toShowOptions,
  toShowSummaryTable,
  toTierSummaryTable,
} from '@/src/sections/reservations/utils/summary-view';
import { MSG_D12 } from '@/src/shared/messages/d12';
import type { ReservationStatus } from '@/src/types/booking';
import { ADMIN_PAGE_SIZE } from '@/src/types/common';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export type ReservationTab = 'list' | 'summary' | 'invite';
export type StatusFilter = ReservationStatus | 'ALL';
const ALL = 'ALL';
const SEARCH_DEBOUNCE_MS = 300;
/** 공연 선택 목록 — 계약 size ≤100 */
const PERFORMANCE_QUERY = { page: 1, size: 100 };

export function useReservationsViewModel(clientPublicUrl: string | null) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const snackbar = useAppSnackbar();
  const urlPerformanceId = searchParams.get('performanceId');
  const urlQ = searchParams.get('q') ?? '';
  const urlKey = searchParams.toString();

  const [chosenId, setChosenId] = useState<string | null>(urlPerformanceId);
  const [tab, setTab] = useState<ReservationTab>('list');
  const [showFilter, setShowFilter] = useState<string>(ALL);
  const [status, setStatus] = useState<StatusFilter>(ALL);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [searchInput, setSearchInput] = useState(urlQ);
  const [search, setSearch] = useState(urlQ);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [autoOpenedKey, setAutoOpenedKey] = useState<string | null>(null);
  const [appliedUrlKey, setAppliedUrlKey] = useState(urlKey);

  // URL(헤더 빠른 검색 → paths.reservationFocus)이 바뀌면 그 값으로 다시 맞춘다 — 렌더 중 파생 상태 조정
  if (appliedUrlKey !== urlKey) {
    setAppliedUrlKey(urlKey);
    if (urlPerformanceId || urlQ) {
      if (urlPerformanceId) setChosenId(urlPerformanceId);
      setTab('list');
      setShowFilter(ALL);
      setStatus(ALL);
      setOverdueOnly(false);
      setSearchInput(urlQ);
      setSearch(urlQ);
      setPage(1);
      setAutoOpenedKey(null);
    }
  }

  // 검색 디바운스
  useEffect(() => {
    if (searchInput === search) return;
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const performancesQuery = usePerformances(PERFORMANCE_QUERY);
  const nearestQuery = useNearestShowPerformanceId();
  const performances = useMemo(
    () => performancesQuery.data?.items ?? [],
    [performancesQuery.data]
  );
  const performanceId = nearestQuery.isPending
    ? null
    : pickPerformanceId(
        [chosenId, nearestQuery.data],
        performances.map((p) => p.id)
      );
  const performanceTitle =
    performances.find((p) => p.id === performanceId)?.title ?? null;

  const summaryQuery = useReservationSummary(performanceId);
  const tierQuery = useReservationTierOptions(performanceId);
  const listQuery = useReservations({
    performanceId: performanceId ?? undefined,
    showId: showFilter === ALL ? undefined : showFilter,
    status: status === ALL ? undefined : status,
    deadlinePassed: overdueOnly ? true : undefined,
    q: search.trim() || undefined,
    page,
    size: ADMIN_PAGE_SIZE,
  });

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);
  const ordered = useMemo(
    () => orderWithExactMatch(items, search),
    [items, search]
  );
  const rows = useMemo(() => ordered.items.map(toReservationRow), [ordered]);

  const clampedPage = listQuery.data
    ? clampPage(page, listQuery.data.totalPages)
    : page;
  if (clampedPage !== page) setPage(clampedPage);

  // 정확 일치 → 상세 드로어를 검색어마다 1번 연다(§6.1a)
  const exactKey = ordered.matchId
    ? `${performanceId}:${ordered.code}:${ordered.matchId}`
    : null;
  if (exactKey && exactKey !== autoOpenedKey) {
    setAutoOpenedKey(exactKey);
    setSelected(items.find((r) => r.id === ordered.matchId) ?? null);
  }

  const listError = listQuery.isError ? listQuery.error : null;
  useEffect(() => {
    if (listError) snackbar.error(toApiErrorMessage(listError));
  }, [listError, snackbar]);

  const findReservation = (id: string) =>
    items.find((r) => r.id === id) ?? (selected?.id === id ? selected : null);
  const actions = useReservationActions(findReservation, performanceId);
  const invite = useInviteLinks(clientPublicUrl, performanceId);

  /** URL 의 포커스 값은 한 번 쓰면 지운다(다시 같은 예매로 들어와도 적용되게) */
  const clearUrlFocus = () => {
    if (urlPerformanceId || urlQ)
      router.replace(paths.reservations, { scroll: false });
  };
  const resetList = () => setPage(1);

  const summary = summaryQuery.data;
  const showOptions = toShowOptions(summary);
  const drawerReservation = selected
    ? (items.find((r) => r.id === selected.id) ?? selected)
    : null;

  return {
    /** 명단 PDF 저장 — 회차 pill 을 하나 골랐을 때만(전체면 null) */
    printShowId: showFilter === ALL ? null : showFilter,
    tab,
    performances,
    performanceId,
    performanceTitle,
    isPerformancesLoading:
      performancesQuery.isPending ||
      (nearestQuery.isPending && performances.length > 0),
    isPerformancesError: performancesQuery.isError && !performancesQuery.data,
    performancesErrorMessage: performancesQuery.isError
      ? toApiErrorMessage(performancesQuery.error)
      : '',
    hasNoPerformance:
      Boolean(performancesQuery.data) && performances.length === 0,
    kpis: summary ? toReservationKpis(summary) : null,
    overdueCount: summary?.totals.overdueCount ?? 0,
    showOptions: showOptions.map((s) => ({ value: s.id, label: s.label })),
    manualShowOptions: showOptions.map((s) => ({
      id: s.id,
      label: s.longLabel,
      remainingSeats: s.remainingSeats,
    })),
    tierOptions: tierQuery.data ?? [],
    showSummary: summary ? toShowSummaryTable(summary) : null,
    tierSummary: summary ? toTierSummaryTable(summary) : null,
    inviterSummary: summary ? toInviterSummaryTable(summary) : null,
    isSummaryLoading: summaryQuery.isPending,
    isSummaryError: summaryQuery.isError,
    summaryErrorMessage: summaryQuery.isError
      ? toApiErrorMessage(summaryQuery.error)
      : '',
    showFilter,
    status,
    overdueOnly,
    searchInput,
    hasFilter:
      showFilter !== ALL || status !== ALL || overdueOnly || search !== '',
    rows,
    matchId: ordered.matchId,
    countText: listQuery.data
      ? ordered.matchId && ordered.code
        ? MSG_D12.COUNT_EXACT(listQuery.data.totalCount, ordered.code)
        : MSG_D12.COUNT(listQuery.data.totalCount)
      : null,
    page,
    totalPages: listQuery.data?.totalPages ?? 1,
    isListLoading: listQuery.isPending,
    isListFetching: listQuery.isFetching,
    isListError: listQuery.isError && !listQuery.data,
    listErrorMessage: listError ? toApiErrorMessage(listError) : '',
    drawerReservation,
    drawerRow: drawerReservation ? toReservationRow(drawerReservation) : null,
    actions,
    invite,
    onRetryPerformances: () => void performancesQuery.refetch(),
    onRetrySummary: () => void summaryQuery.refetch(),
    onRetryList: () => void listQuery.refetch(),
    onPerformanceChange: (id: string) => {
      clearUrlFocus();
      setChosenId(id);
      setShowFilter(ALL);
      setSearchInput('');
      setSearch('');
      setSelected(null);
      resetList();
    },
    onTabChange: setTab,
    onShowFilterChange: (value: string) => {
      setShowFilter(value);
      resetList();
    },
    onStatusChange: (value: StatusFilter) => {
      setStatus(value);
      resetList();
    },
    onToggleOverdue: () => {
      setOverdueOnly((value) => !value);
      resetList();
    },
    onSearchChange: (value: string) => {
      clearUrlFocus();
      setSearchInput(value);
      setAutoOpenedKey(null);
    },
    onResetFilters: () => {
      clearUrlFocus();
      setShowFilter(ALL);
      setStatus(ALL);
      setOverdueOnly(false);
      setSearchInput('');
      setSearch('');
      resetList();
    },
    onPageChange: setPage,
    onOpenDetail: (id: string) => setSelected(findReservation(id)),
    onCloseDetail: () => setSelected(null),
  };
}

export type ReservationsViewModel = ReturnType<typeof useReservationsViewModel>;
