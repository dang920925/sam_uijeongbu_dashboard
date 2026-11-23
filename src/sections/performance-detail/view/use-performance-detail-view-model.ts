'use client';

// ----------------------------------------------------------------------
// SCR-D04 공연 상세·반 관리 ViewModel(FN-09·10). JSX 없음.
// - 상세 404(PERF_001) → 'not-found', 그 밖 실패 → 'error'(다시 시도).
// - 공연 수정: 공용 PerformanceFormDialog(mode='edit'), 초기값 toPerformanceFormInput. 실패는 다이얼로그 안 문구.
// - 반 삭제: ConfirmDialog → 실패 시 닫고 스낵바(designer W3 ConfirmDialog 규격).
// - 저장 성공(다이얼로그가 닫히는 동작)은 스낵바 "저장되었습니다"(designer W3 스낵바 규격·확인 4).
// - (U47) 공연 삭제: 확인 체크 뒤 DELETE → 성공하면 목록으로(홈페이지 재검증은 BFF 가 DELETE 2xx 뒤 자동 — U27),
//   실패(PERF_002 예매 있음 등)는 창 안 문구.
// ----------------------------------------------------------------------
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { paths } from '@/app/paths';
import { toPerformanceFormInput } from '@/src/api/performance-mapper';
import {
  useDeleteClass,
  useDeletePerformance,
  usePerformance,
  usePerformanceClasses,
  useSavePerformance,
} from '@/src/api/performance-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  isNotFoundError,
  toApiErrorMessage,
} from '@/src/utils/api-error-message';
import {
  toClassRowDisplay,
  toPerformanceInfoDisplay,
} from '@/src/sections/performance-detail/utils/performance-detail-display';
import { usePerformanceClassDialog } from '@/src/sections/performance-detail/view/use-performance-class-dialog';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D04 } from '@/src/shared/messages/d04';
import type { PerformanceFormInput } from '@/src/types/performance';
import { useErrorSnackbar } from '@/src/hooks/use-error-snackbar';
import {
  classesErrorSnackbar,
  detailErrorSnackbar,
} from '@/src/sections/performance-detail/utils/detail-error-snackbar';
import { useHomepagePreview } from '@/src/sections/performance-detail/view/use-homepage-preview';

export type PerformanceDetailStatus =
  'loading' | 'not-found' | 'error' | 'ready';

export function usePerformanceDetailViewModel(
  performanceId: string,
  clientPublicUrl: string | null
) {
  const snackbar = useAppSnackbar();
  const preview = useHomepagePreview(performanceId, clientPublicUrl);
  const performanceQuery = usePerformance(performanceId);
  const classesQuery = usePerformanceClasses(performanceId);
  const savePerformance = useSavePerformance(performanceId);
  const deleteClass = useDeleteClass();
  const classDialog = usePerformanceClassDialog(performanceId);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const router = useRouter();
  const deletePerformance = useDeletePerformance();
  const [performanceDelete, setPerformanceDelete] = useState<{
    isChecked: boolean;
    errorMessage: string | null;
  } | null>(null);

  const performance = performanceQuery.data ?? null;
  const status: PerformanceDetailStatus = performanceQuery.isPending
    ? 'loading'
    : performanceQuery.isError
      ? isNotFoundError(performanceQuery.error)
        ? 'not-found'
        : 'error'
      : 'ready';

  const classes = classesQuery.data ?? [];

  // 상세 404 는 전용 화면(스낵바 없음), 반 오류 스낵바는 상세가 ready 일 때만(qa2 QA2-003 경쟁 상태)
  useErrorSnackbar(
    detailErrorSnackbar(
      status,
      performanceQuery.isError
        ? toApiErrorMessage(performanceQuery.error)
        : null
    )
  );
  useErrorSnackbar(
    classesErrorSnackbar(
      status,
      classesQuery.isError ? toApiErrorMessage(classesQuery.error) : null
    )
  );

  const handleEditSubmit = (input: PerformanceFormInput) => {
    setEditError(null);
    savePerformance.mutate(input, {
      onSuccess: () => {
        setIsEditOpen(false);
        snackbar.success(MSG_COMMON.SAVED);
      },
      onError: (error) => setEditError(toApiErrorMessage(error)),
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;
    deleteClass.mutate(deleteTargetId, {
      onSuccess: () => setDeleteTargetId(null),
      onError: (error) => {
        setDeleteTargetId(null);
        snackbar.error(toApiErrorMessage(error));
      },
    });
  };

  return {
    status,
    errorMessage: performanceQuery.isError
      ? toApiErrorMessage(performanceQuery.error)
      : null,
    onRetry: () => void performanceQuery.refetch(),
    info: performance ? toPerformanceInfoDisplay(performance) : null,
    classSection: {
      isLoading: classesQuery.isPending,
      errorMessage: classesQuery.isError
        ? toApiErrorMessage(classesQuery.error)
        : null,
      onRetry: () => void classesQuery.refetch(),
      rows: classes.map(toClassRowDisplay),
      onAdd: classDialog.onOpenCreate,
      onEdit: (id: string) => {
        const target = classes.find((c) => c.id === id);
        if (target) classDialog.onOpenEdit(target);
      },
      onDelete: (id: string) => setDeleteTargetId(id),
    },
    classDialog,
    editDialog: {
      isOpen: isEditOpen,
      initialValue: performance ? toPerformanceFormInput(performance) : null,
      isSubmitting: savePerformance.isPending,
      errorMessage: editError,
      onOpen: () => {
        setEditError(null);
        setIsEditOpen(true);
      },
      onClose: () => setIsEditOpen(false),
      onSubmit: handleEditSubmit,
    },
    performanceDelete: {
      title: performance?.title ?? '',
      isOpen: performanceDelete !== null,
      isChecked: performanceDelete?.isChecked ?? false,
      isDeleting: deletePerformance.isPending,
      errorMessage: performanceDelete?.errorMessage ?? null,
      onOpen: () =>
        setPerformanceDelete({ isChecked: false, errorMessage: null }),
      onToggleCheck: (checked: boolean) =>
        setPerformanceDelete((s) => (s ? { ...s, isChecked: checked } : s)),
      onConfirm: () => {
        if (!performanceDelete?.isChecked) return;
        deletePerformance.mutate(performanceId, {
          onSuccess: () => {
            setPerformanceDelete(null);
            snackbar.success(MSG_D04.DELETE_PERFORMANCE_DONE);
            router.push(paths.performances.root);
          },
          onError: (error) =>
            setPerformanceDelete((s) =>
              s ? { ...s, errorMessage: toApiErrorMessage(error) } : s
            ),
        });
      },
      onClose: () => setPerformanceDelete(null),
    },
    preview,
    deleteConfirm: {
      isOpen: deleteTargetId !== null,
      isDeleting: deleteClass.isPending,
      onConfirm: handleDeleteConfirm,
      onCancel: () => setDeleteTargetId(null),
    },
  };
}

export type PerformanceDetailViewModel = ReturnType<
  typeof usePerformanceDetailViewModel
>;
