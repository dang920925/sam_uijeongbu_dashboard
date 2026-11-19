'use client';

// ----------------------------------------------------------------------
// 공연 관리(SCR-D03) ViewModel — 목록(20건 페이지, 등록일 최신순 — 서버 정렬) · 행 이동 · "공연 추가" 다이얼로그.
// - 생성 실패는 다이얼로그 안 문구(현행 Performances.tsx:188) — 입력을 잃지 않게.
// - 생성 성공은 다이얼로그를 닫고 1쪽으로 간다(새 공연이 최신순 맨 위). 현행에 성공 문구가 없어 스낵바는 띄우지 않는다.
// - 목록·요약 캐시 무효화는 useCreatePerformance 가 한다.
// ----------------------------------------------------------------------
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { paths } from '@/app/paths';
import {
  useCreatePerformance,
  usePerformances,
} from '@/src/api/performance-queries';
import { toPerformanceListRows } from '@/src/sections/performance-list/utils/to-performance-list-rows';
import { MSG_PERF_FORM } from '@/src/shared/messages/performance-form';
import { ADMIN_PAGE_SIZE } from '@/src/types/common';
import type { PerformanceFormInput } from '@/src/types/performance';
import { useErrorSnackbar } from '@/src/hooks/use-error-snackbar';
import { MSG_D03 } from '@/src/shared/messages/d03';

export function usePerformanceListViewModel() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const query = usePerformances({ page, size: ADMIN_PAGE_SIZE });
  const createMutation = useCreatePerformance();
  const totalPages = query.data?.totalPages ?? 1;

  const handleOpenDialog = () => {
    createMutation.reset();
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    createMutation.reset();
  };

  const handleCreate = (input: PerformanceFormInput) => {
    createMutation.mutate(input, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setPage(1);
      },
    });
  };

  useErrorSnackbar(query.isError ? MSG_D03.ERROR : null);

  return {
    isLoading: query.isPending || (query.isError && query.isFetching),
    isError: query.isError,
    rows: query.data ? toPerformanceListRows(query.data.items) : [],
    page,
    totalPages,
    hasPagination: totalPages > 1,
    onPageChange: setPage,
    onRowClick: (id: string) => router.push(paths.performances.detail(id)),
    onRetry: () => {
      void query.refetch();
    },
    dialog: {
      open: isDialogOpen,
      isSubmitting: createMutation.isPending,
      errorMessage: createMutation.isError ? MSG_PERF_FORM.CREATE_FAILED : null,
      onOpen: handleOpenDialog,
      onClose: handleCloseDialog,
      onSubmit: handleCreate,
    },
  };
}
