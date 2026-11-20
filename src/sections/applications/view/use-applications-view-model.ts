'use client';

// ----------------------------------------------------------------------
// SCR-D06 신청서 관리 ViewModel(FN-13, D6 승인과 등록 분리 · U31 보강 한 행 목록). JSX 없음.
// - 필터(유형 pill·처리 상태·작품·연락·진행)·정렬·페이지는 VM 상태(현행 방식) → 목록 조회. 필터를 바꾸면 1쪽으로.
// - 행 클릭 → 상세 드로어. 드로어는 고른 신청 객체를 들고 승인·거절·등록·연락·진행 응답으로 갱신한다
//   (필터에서 빠져도 상세는 결과를 계속 보여 주고, 이어서 "단원으로 등록"할 수 있게).
// - 연락 토글·메모 저장·진행 변경 실패(APP_012 등)는 스낵바(훅이 목록을 다시 불러옴).
// - 머리 "미처리 n건 · 연락 전 n건" = 대기 건수(전체) · 요약 uncontactedPendingCount.
// ----------------------------------------------------------------------
import { useEffect, useMemo, useState } from 'react';

import {
  useApplications,
  useApproveApplication,
  usePendingApplicationCount,
  useRefreshApplication,
  useRegisterMemberFromApplication,
  useRejectApplication,
  useUpdateApplicationContact,
  useUpdateApplicationProgress,
} from '@/src/api/application-queries';
import { useDashboardSummary } from '@/src/api/dashboard-queries';
import { usePerformances } from '@/src/api/performance-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  changeAppType,
  DEFAULT_APPLICATION_FILTERS,
  hasActiveFilter,
  nextSort,
  toApplicationListQuery,
  toAriaSort,
  toProgressFilterOptions,
  toWorkFilterOptions,
  type ApplicationFilters,
  type AppTypeFilter,
} from '@/src/sections/applications/utils/application-filters';
import {
  toApplicationRow,
  toRegisterFormInitial,
  type ApplicationRow,
} from '@/src/sections/applications/utils/application-row';
import { clampPage } from '@/src/sections/applications/utils/clamp-page';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D06 } from '@/src/shared/messages/d06';
import type { Application } from '@/src/types/application';
import type { ApplicationProgress, ApplicationSort } from '@/src/types/codes';
import { ADMIN_MAX_PAGE_SIZE, ADMIN_PAGE_SIZE } from '@/src/types/common';
import type { MemberFormInput } from '@/src/types/member';
import { toApiErrorMessage as toErrorMessage } from '@/src/utils/api-error-message';

interface PendingConfirm {
  kind: 'approve' | 'reject';
  app: Application;
}

export function useApplicationsViewModel() {
  const snackbar = useAppSnackbar();
  const [filters, setFilters] = useState<ApplicationFilters>(
    DEFAULT_APPLICATION_FILTERS
  );
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Application | null>(null);
  const [memo, setMemo] = useState('');
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [registerTarget, setRegisterTarget] = useState<Application | null>(
    null
  );

  const listQuery = useApplications(
    toApplicationListQuery(filters, page, ADMIN_PAGE_SIZE)
  );
  const pendingQuery = usePendingApplicationCount();
  const summaryQuery = useDashboardSummary();
  const performancesQuery = usePerformances({ size: ADMIN_MAX_PAGE_SIZE });
  const approve = useApproveApplication();
  const reject = useRejectApplication();
  const register = useRegisterMemberFromApplication();
  const updateContact = useUpdateApplicationContact();
  const updateProgress = useUpdateApplicationProgress();
  const refreshApplication = useRefreshApplication();

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);
  const rows = useMemo(() => items.map(toApplicationRow), [items]);
  const workOptions = useMemo(
    () => toWorkFilterOptions(performancesQuery.data?.items ?? []),
    [performancesQuery.data]
  );
  const totalPages = listQuery.data?.totalPages ?? 1;

  // 처리 후 마지막 쪽이 비면 앞 쪽으로 — 렌더 중 파생 상태 조정(React 문서 'adjusting state when a prop changes')
  const clampedPage = listQuery.data
    ? clampPage(page, listQuery.data.totalPages)
    : page;
  if (clampedPage !== page) setPage(clampedPage);

  const listError = listQuery.isError ? listQuery.error : null;
  useEffect(() => {
    if (listError) snackbar.error(toErrorMessage(listError));
  }, [listError, snackbar]);

  const findApp = (id: string) =>
    items.find((app) => app.id === id) ??
    (selected?.id === id ? selected : undefined);

  const replaceSelected = (updated: Application) =>
    setSelected((current) => (current?.id === updated.id ? updated : current));

  const updateFilters = (next: ApplicationFilters) => {
    setFilters(next);
    setPage(1);
  };
  const setFilter = <K extends keyof ApplicationFilters>(
    key: K,
    value: ApplicationFilters[K]
  ) => updateFilters({ ...filters, [key]: value });

  const handleView = (id: string) => {
    const app = findApp(id) ?? null;
    setSelected(app);
    setMemo(app?.contactNote ?? '');
  };

  const handleToggleContact = (id: string, contacted: boolean) =>
    updateContact.mutate(
      { id, contacted },
      {
        onSuccess: replaceSelected,
        onError: (error) => snackbar.error(toErrorMessage(error)),
      }
    );

  const handleSaveMemo = () => {
    if (!selected) return;
    updateContact.mutate(
      { id: selected.id, contacted: selected.contactedAt !== null, note: memo },
      {
        onSuccess: (updated) => {
          replaceSelected(updated);
          setMemo(updated.contactNote ?? '');
          snackbar.success(MSG_COMMON.SAVED);
        },
        onError: (error) => snackbar.error(toErrorMessage(error)),
      }
    );
  };

  const handleChangeProgress = (id: string, progress: ApplicationProgress) =>
    updateProgress.mutate(
      { id, progress },
      {
        onSuccess: replaceSelected,
        onError: (error) => {
          snackbar.error(toErrorMessage(error));
          void refreshApplication(id).then((fresh) => {
            if (fresh) replaceSelected(fresh);
          });
        },
      }
    );

  const handleRequest = (kind: PendingConfirm['kind'], id: string) => {
    const app = findApp(id);
    if (app) setConfirm({ kind, app });
  };

  const handleConfirm = () => {
    if (!confirm) return;
    const mutation = confirm.kind === 'approve' ? approve : reject;
    mutation.mutate(confirm.app.id, {
      onSuccess: (updated) => {
        replaceSelected(updated);
        setConfirm(null);
      },
      onError: (error) => {
        const id = confirm.app.id;
        setConfirm(null);
        snackbar.error(toErrorMessage(error));
        // 이미 처리된 신청(409 APP_007)이면 열린 상세도 서버 상태로 바꾼다(qa1 QA1-026)
        void refreshApplication(id).then((fresh) => {
          if (fresh) replaceSelected(fresh);
        });
      },
    });
  };

  const handleSubmitRegister = (input: MemberFormInput) => {
    if (!registerTarget) return;
    register.mutate(
      { id: registerTarget.id, input },
      {
        onSuccess: (result) => {
          replaceSelected(result.application);
          setRegisterTarget(null);
          snackbar.success(MSG_D06.REGISTERED_SUCCESS);
        },
        onError: (error) => snackbar.error(toErrorMessage(error)),
      }
    );
  };

  return {
    filters,
    page,
    totalPages,
    totalCount: listQuery.data?.totalCount ?? null,
    pendingCount: pendingQuery.data ?? 0,
    uncontactedCount: summaryQuery.data?.uncontactedPendingCount ?? 0,
    workOptions,
    progressOptions: toProgressFilterOptions(filters.appType),
    sortState: {
      createdAt: toAriaSort(filters, 'createdAt'),
      progress: toAriaSort(filters, 'progress'),
      contactedAt: toAriaSort(filters, 'contactedAt'),
    },
    rows,
    selectedId: selected?.id ?? null,
    isLoading: listQuery.isPending,
    isError: listQuery.isError && !listQuery.data,
    errorMessage: listError ? toErrorMessage(listError) : '',
    emptyMessage:
      hasActiveFilter(filters) || filters.appType === 'ALL'
        ? MSG_D06.EMPTY_FILTERED
        : filters.appType === 'WORK_OBSERVATION'
          ? MSG_D06.EMPTY_OBSERVATION
          : MSG_D06.EMPTY_CONSULTATION,
    detail: selected ? toApplicationRow(selected) : null,
    memo,
    isSavingMemo: updateContact.isPending,
    confirmMessage: confirm
      ? confirm.kind === 'approve'
        ? MSG_D06.CONFIRM_APPROVE(confirm.app.applicantName)
        : MSG_D06.CONFIRM_REJECT(confirm.app.applicantName)
      : '',
    confirmKind: confirm?.kind ?? null,
    isConfirming: approve.isPending || reject.isPending,
    registerInitial: registerTarget
      ? toRegisterFormInitial(registerTarget)
      : null,
    isRegistering: register.isPending,
    onAppTypeChange: (next: AppTypeFilter) =>
      updateFilters(changeAppType(filters, next)),
    onStatusChange: (next: ApplicationFilters['status']) =>
      setFilter('status', next),
    onWorkChange: (next: string) => setFilter('performanceId', next),
    onContactFilterChange: (next: ApplicationFilters['contact']) =>
      setFilter('contact', next),
    onProgressFilterChange: (next: ApplicationFilters['progress']) =>
      setFilter('progress', next),
    onSort: (sort: ApplicationSort) => updateFilters(nextSort(filters, sort)),
    onPageChange: setPage,
    onRetry: () => void listQuery.refetch(),
    onView: handleView,
    onCloseDetail: () => setSelected(null),
    onToggleContact: handleToggleContact,
    onMemoChange: (value: string) => setMemo(value.slice(0, MSG_D06.MEMO_MAX)),
    onSaveMemo: handleSaveMemo,
    onChangeProgress: handleChangeProgress,
    onRequestApprove: (id: string) => handleRequest('approve', id),
    onRequestReject: (id: string) => handleRequest('reject', id),
    onConfirm: handleConfirm,
    onCancelConfirm: () => setConfirm(null),
    onRequestRegister: (id: string) => setRegisterTarget(findApp(id) ?? null),
    onSubmitRegister: handleSubmitRegister,
    onCloseRegister: () => setRegisterTarget(null),
  };
}

export type ApplicationsViewModel = ReturnType<typeof useApplicationsViewModel>;
export type { ApplicationRow };
