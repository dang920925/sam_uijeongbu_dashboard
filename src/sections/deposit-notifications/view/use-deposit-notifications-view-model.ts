'use client';

// ----------------------------------------------------------------------
// SCR-D12 '입금 알림' 탭 ViewModel(R2) — 판정 결과 거르기·페이지·목록, 무시, 예매 연결 다이얼로그(예매번호로 입금 대기 찾기 →
// 골라 연결·확정), 알림 문구 시험(저장 없이 판정 미리 보기). JSX 없음.
// ----------------------------------------------------------------------
import { useMemo, useState } from 'react';

import {
  toDepositPreviewView,
  toDepositRow,
  type DepositRow,
} from '@/src/api/deposit-notification-mapper';
import {
  useDepositCandidateReservations,
  useDepositNotifications,
  useIgnoreDepositNotification,
  useMatchDepositNotification,
  usePreviewDeposit,
} from '@/src/api/deposit-notification-queries';
import { formatWon } from '@/src/api/reservation-mapper';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  depositFilterOptions,
  toCodeQuery,
  toStatusQuery,
  type DepositFilter,
} from '@/src/sections/deposit-notifications/utils/deposit-filter';
import { MSG_DEP } from '@/src/shared/messages/deposit-notifications';
import { ADMIN_PAGE_SIZE } from '@/src/types/common';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export interface MatchOption {
  id: string;
  version: number;
  label: string;
}

export function useDepositNotificationsViewModel() {
  const snackbar = useAppSnackbar();
  const [filter, setFilter] = useState<DepositFilter>('ALL');
  const [page, setPage] = useState(1);
  const [matchTarget, setMatchTarget] = useState<DepositRow | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [searchedCode, setSearchedCode] = useState<string | null>(null);
  const [chosenReservationId, setChosenReservationId] = useState<string | null>(
    null
  );
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewText, setPreviewText] = useState('');

  const listQuery = useDepositNotifications({
    status: toStatusQuery(filter),
    page,
    size: ADMIN_PAGE_SIZE,
  });
  const rows = useMemo(
    () => (listQuery.data?.items ?? []).map(toDepositRow),
    [listQuery.data]
  );

  const candidatesQuery = useDepositCandidateReservations(searchedCode);
  const matchOptions: MatchOption[] = useMemo(
    () =>
      (candidatesQuery.data?.items ?? [])
        .filter((r) => r.status === 'PENDING')
        .map((r) => ({
          id: r.id,
          version: r.version,
          label: MSG_DEP.MATCH_OPTION(
            r.code,
            r.depositorName ?? r.bookerName,
            formatWon(r.amount),
            r.performanceTitle ?? ''
          ),
        })),
    [candidatesQuery.data]
  );

  const ignoreMutation = useIgnoreDepositNotification();
  const matchMutation = useMatchDepositNotification();
  const previewMutation = usePreviewDeposit();

  function closeMatch() {
    setMatchTarget(null);
    setCodeInput('');
    setSearchedCode(null);
    setChosenReservationId(null);
    matchMutation.reset();
  }

  return {
    filter,
    filterOptions: depositFilterOptions(),
    page,
    totalPages: listQuery.data?.totalPages ?? 0,
    rows,
    isLoading: listQuery.isPending,
    isError: listQuery.isError,
    errorMessage: listQuery.isError ? toApiErrorMessage(listQuery.error) : '',
    isFetching: listQuery.isFetching,
    hasFilter: filter !== 'ALL',
    busyId: ignoreMutation.isPending ? ignoreMutation.variables : null,
    onFilterChange: (value: DepositFilter) => {
      setFilter(value);
      setPage(1);
    },
    onPageChange: setPage,
    onRetry: () => void listQuery.refetch(),
    onIgnore: (row: DepositRow) =>
      ignoreMutation.mutate(row.id, {
        onSuccess: () => snackbar.success(MSG_DEP.IGNORED),
        onError: (error) => snackbar.error(toApiErrorMessage(error)),
      }),

    match: {
      target: matchTarget,
      codeInput,
      canSearch: toCodeQuery(codeInput) !== null,
      hasSearched: searchedCode !== null,
      isSearching: candidatesQuery.isFetching,
      options: matchOptions,
      chosenId: chosenReservationId,
      isSubmitting: matchMutation.isPending,
      errorMessage: matchMutation.isError
        ? toApiErrorMessage(matchMutation.error)
        : null,
      onOpen: (row: DepositRow) => {
        setMatchTarget(row);
        const code = row.reservation?.code ?? '';
        setCodeInput(code);
        setSearchedCode(toCodeQuery(code));
        setChosenReservationId(row.reservation?.id ?? null);
      },
      onClose: closeMatch,
      onCodeChange: setCodeInput,
      onSearch: () => {
        setSearchedCode(toCodeQuery(codeInput));
        setChosenReservationId(null);
      },
      onChoose: setChosenReservationId,
      onSubmit: () => {
        const chosen = matchOptions.find((o) => o.id === chosenReservationId);
        if (!matchTarget || !chosen) return;
        matchMutation.mutate(
          {
            id: matchTarget.id,
            body: { reservationId: chosen.id, version: chosen.version },
          },
          {
            onSuccess: () => {
              snackbar.success(MSG_DEP.MATCHED);
              closeMatch();
            },
          }
        );
      },
    },

    preview: {
      title: previewTitle,
      text: previewText,
      canRun: previewText.trim() !== '' && !previewMutation.isPending,
      isRunning: previewMutation.isPending,
      result: previewMutation.data
        ? toDepositPreviewView(previewMutation.data)
        : null,
      autoConfirm: previewMutation.data?.autoConfirm ?? true,
      errorMessage: previewMutation.isError
        ? toApiErrorMessage(previewMutation.error)
        : null,
      onTitleChange: setPreviewTitle,
      onTextChange: setPreviewText,
      onRun: () =>
        previewMutation.mutate({
          title: previewTitle.trim() || undefined,
          text: previewText,
        }),
    },
  };
}

export type DepositNotificationsViewModel = ReturnType<
  typeof useDepositNotificationsViewModel
>;
