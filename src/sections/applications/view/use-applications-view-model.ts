'use client';

// ----------------------------------------------------------------------
// SCR-D06 신청서 관리 ViewModel(FN-13, D6 승인과 등록 분리). JSX 없음.
// - 탭(유형)·상태 필터·페이지 → 목록 조회. 탭을 바꾸면 필터 "전체"·1쪽으로(현행 Applications.tsx:135).
// - 상세 다이얼로그는 고른 신청 객체를 들고, 승인·거절·등록 응답으로 갱신한다
//   (필터 "대기"에서 승인하면 목록에서 빠져도 상세는 결과를 계속 보여 주고, 이어서 "단원으로 등록"할 수 있게).
// - 승인·거절 실패(APP_007 등)는 확인창을 닫고 스낵바. 등록 실패(APP_008·009)는 등록 다이얼로그를 연 채 스낵바(designer snackbar-error).
// ----------------------------------------------------------------------
import { useEffect, useMemo, useState } from 'react';

import {
  useApplications,
  useApproveApplication,
  usePendingApplicationCount,
  useRegisterMemberFromApplication,
  useRejectApplication,
} from '@/src/api/application-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  toApplicationRow,
  toRegisterFormInitial,
  type ApplicationRow,
} from '@/src/sections/applications/utils/application-row';
import { toApiErrorMessage as toErrorMessage } from '@/src/utils/api-error-message';
import { MSG_D06 } from '@/src/shared/messages/d06';
import type { Application } from '@/src/types/application';
import type { ApplicationStatus, ApplicationType } from '@/src/types/codes';
import { ADMIN_PAGE_SIZE } from '@/src/types/common';
import type { MemberFormInput } from '@/src/types/member';

export type StatusFilter = ApplicationStatus | 'ALL';

interface PendingConfirm {
  kind: 'approve' | 'reject';
  app: Application;
}

export function useApplicationsViewModel() {
  const snackbar = useAppSnackbar();
  const [appType, setAppType] = useState<ApplicationType>('WORK_OBSERVATION');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Application | null>(null);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [registerTarget, setRegisterTarget] = useState<Application | null>(
    null
  );

  const listQuery = useApplications({
    appType,
    status: status === 'ALL' ? undefined : status,
    page,
    size: ADMIN_PAGE_SIZE,
  });
  const pendingQuery = usePendingApplicationCount(appType);
  const approve = useApproveApplication();
  const reject = useRejectApplication();
  const register = useRegisterMemberFromApplication();

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);
  const rows = useMemo(() => items.map(toApplicationRow), [items]);
  const totalPages = listQuery.data?.totalPages ?? 1;

  // 처리 후 마지막 쪽이 비면 앞 쪽으로 — 렌더 중 파생 상태 조정(React 문서 'adjusting state when a prop changes')
  if (listQuery.data && page > listQuery.data.totalPages)
    setPage(listQuery.data.totalPages);

  // 목록 조회 실패는 스낵바도 띄운다(designer 스낵바 규격 "목록 조회 실패")
  const listError = listQuery.isError ? listQuery.error : null;
  useEffect(() => {
    if (listError) snackbar.error(toErrorMessage(listError));
  }, [listError, snackbar]);

  const findApp = (id: string) =>
    items.find((app) => app.id === id) ??
    (selected?.id === id ? selected : undefined);

  const replaceSelected = (updated: Application) =>
    setSelected((current) => (current?.id === updated.id ? updated : current));

  const handleTabChange = (next: ApplicationType) => {
    setAppType(next);
    setStatus('ALL');
    setPage(1);
  };

  const handleStatusChange = (next: StatusFilter) => {
    setStatus(next);
    setPage(1);
  };

  const handleView = (id: string) => setSelected(findApp(id) ?? null);

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
        setConfirm(null);
        snackbar.error(toErrorMessage(error));
      },
    });
  };

  const handleRequestRegister = (id: string) =>
    setRegisterTarget(findApp(id) ?? null);

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
    appType,
    status,
    page,
    totalPages,
    totalCount: listQuery.data?.totalCount ?? null,
    pendingCount: pendingQuery.data ?? 0,
    rows,
    isLoading: listQuery.isPending,
    isError: listQuery.isError && !listQuery.data,
    errorMessage: listError ? toErrorMessage(listError) : '',
    emptyMessage:
      appType === 'WORK_OBSERVATION'
        ? MSG_D06.EMPTY_OBSERVATION
        : MSG_D06.EMPTY_CONSULTATION,
    detail: selected ? toApplicationRow(selected) : null,
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
    onTabChange: handleTabChange,
    onStatusChange: handleStatusChange,
    onPageChange: setPage,
    onRetry: () => void listQuery.refetch(),
    onView: handleView,
    onCloseDetail: () => setSelected(null),
    onRequestApprove: (id: string) => handleRequest('approve', id),
    onRequestReject: (id: string) => handleRequest('reject', id),
    onConfirm: handleConfirm,
    onCancelConfirm: () => setConfirm(null),
    onRequestRegister: handleRequestRegister,
    onSubmitRegister: handleSubmitRegister,
    onCloseRegister: () => setRegisterTarget(null),
  };
}

export type ApplicationsViewModel = ReturnType<typeof useApplicationsViewModel>;
export type { ApplicationRow };
