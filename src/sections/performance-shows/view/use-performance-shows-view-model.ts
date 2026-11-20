'use client';

// ----------------------------------------------------------------------
// SCR-D11 회차·예매 설정 ViewModel(FN-28·29). JSX 없음.
// - 공연(제목·404) → 'not-found' | 'error' 는 D04 와 같은 상태 카드. 그 밖은 머리+탭을 그리고
//   본문(bodyStatus)만 로딩 스켈레톤 / 오류 "다시 시도" / 내용으로 나눈다(designer 시안 loading·error).
// - 준비 상태 알림: 예매 설정 missingFields + 회차별 missingFields + 링크 전용 등급 여부(utils/booking-readiness).
// - 가격 등급 카드: use-price-tier-section(develop §11.10). clientPublicUrl = 서버 env CLIENT_PUBLIC_URL(page.tsx 가 넘김).
// - 예매 중지 스위치: 바로 PATCH bookingEnabled, 진행 중에는 바뀔 값을 미리 보여 준다. 실패는 스낵바.
// - 회차 삭제: ConfirmDialog → 실패(SHW_004 등)는 닫고 스낵바(designer 시안 snackbar-shw004).
// - (U35) 좌석 지정 스위치: 공연 PATCH seatSelectionEnabled(진행 중엔 바뀔 값을 미리 보임). 켜져 있으면 회차 행에
//   "좌석 배치" → 배치 편집기(use-seat-layout-editor).
// ----------------------------------------------------------------------
import { useState } from 'react';

import { useBookingPolicy } from '@/src/api/booking-policy-queries';
import {
  usePerformance,
  usePerformanceClasses,
} from '@/src/api/performance-queries';
import {
  useDeleteShow,
  usePerformanceShows,
  useSaveShowBookingEnabled,
} from '@/src/api/show-queries';
import { useSaveSeatSelectionEnabled } from '@/src/api/seat-map-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { useErrorSnackbar } from '@/src/hooks/use-error-snackbar';
import { buildReadinessNotice } from '@/src/sections/performance-shows/utils/booking-readiness';
import { toShowRowDisplay } from '@/src/sections/performance-shows/utils/show-row';
import { useBookingPolicyForm } from '@/src/sections/performance-shows/view/use-booking-policy-form';
import { usePriceTierSection } from '@/src/sections/performance-shows/view/use-price-tier-section';
import { useSeatLayoutEditor } from '@/src/sections/performance-shows/view/use-seat-layout-editor';
import { useShowDialog } from '@/src/sections/performance-shows/view/use-show-dialog';
import { MSG_SEAT } from '@/src/shared/messages/seat';
import {
  isNotFoundError,
  toApiErrorMessage,
} from '@/src/utils/api-error-message';

export type PerformanceShowsStatus = 'not-found' | 'error' | 'ready';
export type PerformanceShowsBodyStatus = 'loading' | 'error' | 'ready';

export function usePerformanceShowsViewModel(
  performanceId: string,
  clientPublicUrl: string | null
) {
  const snackbar = useAppSnackbar();
  const performanceQuery = usePerformance(performanceId);
  const policyQuery = useBookingPolicy(performanceId);
  const showsQuery = usePerformanceShows(performanceId);
  const classesQuery = usePerformanceClasses(performanceId);
  const toggle = useSaveShowBookingEnabled();
  const deleteShow = useDeleteShow();
  const policyForm = useBookingPolicyForm(
    performanceId,
    policyQuery.data ?? null
  );
  const showDialog = useShowDialog(performanceId);
  const tierSection = usePriceTierSection(performanceId, clientPublicUrl);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const seatSwitch = useSaveSeatSelectionEnabled(performanceId);
  /** 마지막으로 바꾼 값(실패하면 지운다) — 공연을 다시 받기 전에도 스위치가 되돌아가지 않게 */
  const [seatSet, setSeatSet] = useState<boolean | null>(null);

  const status: PerformanceShowsStatus = performanceQuery.isError
    ? isNotFoundError(performanceQuery.error)
      ? 'not-found'
      : 'error'
    : 'ready';
  const failedQuery = [policyQuery, tierSection.query, showsQuery].find(
    (q) => q.isError
  );
  const bodyStatus: PerformanceShowsBodyStatus =
    performanceQuery.isPending ||
    policyQuery.isPending ||
    tierSection.query.isPending ||
    showsQuery.isPending
      ? 'loading'
      : failedQuery
        ? 'error'
        : 'ready';

  const performanceError = performanceQuery.isError
    ? toApiErrorMessage(performanceQuery.error)
    : null;
  const bodyError = failedQuery ? toApiErrorMessage(failedQuery.error) : null;
  // 404 는 전용 상태 카드(스낵바 없음), 본문 오류는 공연이 보일 때만(D04 qa2 QA2-003 과 같은 규칙)
  useErrorSnackbar(status === 'error' ? performanceError : null);
  useErrorSnackbar(status === 'ready' ? bodyError : null);

  const shows = showsQuery.data ?? [];
  const pendingToggle = toggle.isPending ? toggle.variables : undefined;
  const rows = shows.map((show) => {
    const row = toShowRowDisplay(show);
    return pendingToggle?.id === show.id
      ? { ...row, isStopped: !pendingToggle.bookingEnabled }
      : row;
  });
  const deleteTarget = rows.find((row) => row.id === deleteTargetId) ?? null;
  const seatLayout = useSeatLayoutEditor(rows);
  const seatSelectionEnabled =
    seatSet ?? performanceQuery.data?.seatSelectionEnabled ?? false;

  const handleToggle = (id: string, isStopped: boolean) => {
    if (toggle.isPending) return;
    toggle.mutate(
      { id, bookingEnabled: !isStopped },
      { onError: (error) => snackbar.error(toApiErrorMessage(error)) }
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;
    deleteShow.mutate(deleteTargetId, {
      onSuccess: () => setDeleteTargetId(null),
      onError: (error) => {
        setDeleteTargetId(null);
        snackbar.error(toApiErrorMessage(error));
      },
    });
  };

  return {
    status,
    errorMessage: performanceError,
    onRetry: () => void performanceQuery.refetch(),
    title: performanceQuery.data?.title ?? null,
    bodyStatus,
    bodyErrorMessage: bodyError,
    onBodyRetry: () => {
      if (policyQuery.isError) void policyQuery.refetch();
      if (tierSection.query.isError) void tierSection.query.refetch();
      if (showsQuery.isError) void showsQuery.refetch();
    },
    notice: buildReadinessNotice(
      policyQuery.data?.missingFields ?? [],
      shows.map((show) => show.missingFields),
      tierSection.hasActiveLinkOnlyTier
    ),
    policyForm,
    tierSection,
    seatSelection: {
      enabled: seatSelectionEnabled,
      isSaving: seatSwitch.isPending,
      onToggle: (enabled: boolean) => {
        if (seatSwitch.isPending) return;
        setSeatSet(enabled);
        seatSwitch.mutate(enabled, {
          onSuccess: () =>
            snackbar.success(
              enabled ? MSG_SEAT.SWITCH_SAVED_ON : MSG_SEAT.SWITCH_SAVED_OFF
            ),
          onError: (error) => {
            setSeatSet(null);
            snackbar.error(toApiErrorMessage(error));
          },
        });
      },
    },
    seatLayout,
    showsSection: {
      rows,
      onSeatLayout: seatSelectionEnabled ? seatLayout.onOpen : undefined,
      togglingId: pendingToggle?.id ?? null,
      onAdd: showDialog.onOpenCreate,
      onEdit: (id: string) => {
        const target = shows.find((show) => show.id === id);
        if (target) showDialog.onOpenEdit(target);
      },
      onDelete: (id: string) => setDeleteTargetId(id),
      onToggleStop: handleToggle,
    },
    showDialog,
    classOptions: (classesQuery.data ?? []).map((item) => ({
      value: item.id,
      label: item.name,
    })),
    deleteConfirm: {
      isOpen: deleteTarget !== null,
      description: deleteTarget?.titleText ?? '',
      isDeleting: deleteShow.isPending,
      onConfirm: handleDeleteConfirm,
      onCancel: () => setDeleteTargetId(null),
    },
  };
}

export type PerformanceShowsViewModel = ReturnType<
  typeof usePerformanceShowsViewModel
>;
