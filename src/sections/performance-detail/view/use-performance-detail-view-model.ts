'use client';

// ----------------------------------------------------------------------
// SCR-D04 공연 상세·반 관리 ViewModel(FN-09·10). JSX 없음.
// - 상세 404(PERF_001) → 'not-found', 그 밖 실패 → 'error'(다시 시도).
// - 공연 수정: 공용 PerformanceFormDialog(mode='edit'), 초기값 toPerformanceFormInput. 실패는 다이얼로그 안 문구.
// - 반 삭제: ConfirmDialog → 실패 시 닫고 스낵바(designer W3 ConfirmDialog 규격).
// - 저장 성공(다이얼로그가 닫히는 동작)은 스낵바 "저장되었습니다"(designer W3 스낵바 규격·확인 4).
// ----------------------------------------------------------------------
import { useState } from 'react';

import { toPerformanceFormInput } from '@/src/api/performance-mapper';
import {
  useDeleteClass,
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
import type { PerformanceFormInput } from '@/src/types/performance';

export type PerformanceDetailStatus =
  'loading' | 'not-found' | 'error' | 'ready';

export function usePerformanceDetailViewModel(performanceId: string) {
  const snackbar = useAppSnackbar();
  const performanceQuery = usePerformance(performanceId);
  const classesQuery = usePerformanceClasses(performanceId);
  const savePerformance = useSavePerformance(performanceId);
  const deleteClass = useDeleteClass();
  const classDialog = usePerformanceClassDialog(performanceId);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const performance = performanceQuery.data ?? null;
  const status: PerformanceDetailStatus = performanceQuery.isPending
    ? 'loading'
    : performanceQuery.isError
      ? isNotFoundError(performanceQuery.error)
        ? 'not-found'
        : 'error'
      : 'ready';

  const classes = classesQuery.data ?? [];

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
