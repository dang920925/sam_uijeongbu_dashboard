'use client';

// ----------------------------------------------------------------------
// SCR-D08 일정 관리 ViewModel(FN-15). JSX 없음.
// - 타입 필터·페이지 → 목록(startAt desc, 20건).
// - 다이얼로그 폼 상태를 여기서 들고 있다: "연결 반" 선택지가 고른 공연에 따라 바뀌어(usePerformanceClasses)
//   폼 값이 조회 조건이 되기 때문. 공연을 바꾸면 연결 반은 비운다(D5 연결 반/공연).
// - 저장 실패(SCH_002·PERF_001 등)는 다이얼로그 안 문구, 저장 성공은 닫고 스낵바 "저장되었습니다".
//   삭제 실패는 확인창을 닫고 스낵바(designer 스낵바 규격).
// ----------------------------------------------------------------------
import { useEffect, useMemo, useState } from 'react';

import {
  usePerformanceClasses,
  usePerformances,
} from '@/src/api/performance-queries';
import {
  EMPTY_SCHEDULE_FORM,
  toScheduleFormInput,
  type ScheduleFormInput,
} from '@/src/api/schedule-mapper';
import {
  useCreateSchedule,
  useDeleteSchedule,
  useSaveSchedule,
  useSchedules,
} from '@/src/api/schedule-queries';
import type { SegmentOption } from '@/src/components/segment-pill';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { toScheduleRow } from '@/src/sections/schedules/utils/schedule-row';
import { toApiErrorMessage as toErrorMessage } from '@/src/utils/api-error-message';
import {
  hasScheduleFormErrors,
  NO_SCHEDULE_FORM_ERRORS,
  validateScheduleForm,
  type ScheduleFormErrors,
} from '@/src/sections/schedules/utils/validate-schedule-form';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D08 } from '@/src/shared/messages/d08';
import {
  SCHEDULE_TYPE_LABEL,
  SCHEDULE_TYPES,
  type ScheduleType,
} from '@/src/types/codes';
import { ADMIN_MAX_PAGE_SIZE, ADMIN_PAGE_SIZE } from '@/src/types/common';
import type { Schedule } from '@/src/types/content';

export type ScheduleTypeFilter = ScheduleType | 'ALL';

export interface SelectOption {
  value: string;
  label: string;
}

const FILTER_OPTIONS: SegmentOption<ScheduleTypeFilter>[] = [
  { value: 'ALL', label: MSG_D08.FILTER_ALL },
  ...SCHEDULE_TYPES.map((type) => ({
    value: type,
    label: SCHEDULE_TYPE_LABEL[type],
  })),
];

const TYPE_OPTIONS: SelectOption[] = SCHEDULE_TYPES.map((type) => ({
  value: type,
  label: SCHEDULE_TYPE_LABEL[type],
}));

/** null = 닫힘, editingId null = 추가 */
interface DialogState {
  editingId: string | null;
}

export function useSchedulesViewModel() {
  const snackbar = useAppSnackbar();
  const [typeFilter, setTypeFilter] = useState<ScheduleTypeFilter>('ALL');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [form, setForm] = useState<ScheduleFormInput>(EMPTY_SCHEDULE_FORM);
  const [errors, setErrors] = useState<ScheduleFormErrors>(
    NO_SCHEDULE_FORM_ERRORS
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);

  const listQuery = useSchedules({
    type: typeFilter === 'ALL' ? undefined : typeFilter,
    page,
    size: ADMIN_PAGE_SIZE,
  });
  const performancesQuery = usePerformances({ size: ADMIN_MAX_PAGE_SIZE });
  const classesQuery = usePerformanceClasses(form.performanceId || null);
  const create = useCreateSchedule();
  const save = useSaveSchedule();
  const remove = useDeleteSchedule();

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);
  const rows = useMemo(() => items.map(toScheduleRow), [items]);
  const performanceOptions = useMemo<SelectOption[]>(
    () =>
      (performancesQuery.data?.items ?? []).map((p) => ({
        value: p.id,
        label: p.title,
      })),
    [performancesQuery.data]
  );
  const classOptions = useMemo<SelectOption[]>(
    () =>
      (form.performanceId ? (classesQuery.data ?? []) : []).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [classesQuery.data, form.performanceId]
  );

  // 처리 후 마지막 쪽이 비면 앞 쪽으로 — 렌더 중 파생 상태 조정(React 문서 'adjusting state when a prop changes').
  // 실서버는 0건이면 totalPages 0 을 준다(PaginatedResponseDto) → page 0 요청(400 COMMON_001)이 되지 않게 1 아래로 내리지 않는다.
  const lastPage = Math.max(1, listQuery.data?.totalPages ?? 1);
  if (listQuery.data && page > lastPage) setPage(lastPage);

  const listError = listQuery.isError ? listQuery.error : null;
  useEffect(() => {
    if (listError) snackbar.error(toErrorMessage(listError));
  }, [listError, snackbar]);

  const openDialog = (editingId: string | null, value: ScheduleFormInput) => {
    setForm(value);
    setErrors(NO_SCHEDULE_FORM_ERRORS);
    setSubmitError(null);
    setDialog({ editingId });
  };

  const handleOpenEdit = (id: string) => {
    const schedule = items.find((s) => s.id === id);
    if (schedule) openDialog(id, toScheduleFormInput(schedule));
  };

  const handleFieldChange = <K extends keyof ScheduleFormInput>(
    field: K,
    value: ScheduleFormInput[K]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'performanceId' ? { classId: '' } : {}),
    }));
    if (field in errors)
      setErrors((current) => ({ ...current, [field]: null }));
  };

  const handleSubmit = () => {
    const next = validateScheduleForm(form);
    setErrors(next);
    if (hasScheduleFormErrors(next) || !dialog) return;
    setSubmitError(null);
    const callbacks = {
      onSuccess: () => {
        setDialog(null);
        snackbar.success(MSG_COMMON.SAVED);
      },
      onError: (error: unknown) => setSubmitError(toErrorMessage(error)),
    };
    if (dialog.editingId)
      save.mutate({ id: dialog.editingId, input: form }, callbacks);
    else create.mutate(form, callbacks);
  };

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

  const isEditing = Boolean(dialog?.editingId);

  return {
    filterOptions: FILTER_OPTIONS,
    typeFilter,
    page,
    totalPages: lastPage,
    rows,
    isLoading: listQuery.isPending,
    isError: listQuery.isError && !listQuery.data,
    errorMessage: listError ? toErrorMessage(listError) : '',
    isDialogOpen: dialog !== null,
    dialogTitle: isEditing ? MSG_D08.DIALOG_EDIT : MSG_D08.DIALOG_ADD,
    submitLabel: isEditing ? MSG_COMMON.SAVE : MSG_COMMON.ADD,
    form,
    errors,
    submitError,
    isSubmitting: create.isPending || save.isPending,
    typeOptions: TYPE_OPTIONS,
    performanceOptions,
    classOptions,
    isDeleteOpen: deleteTarget !== null,
    isDeleting: remove.isPending,
    onFilterChange: (next: ScheduleTypeFilter) => {
      setTypeFilter(next);
      setPage(1);
    },
    onPageChange: setPage,
    onRetry: () => void listQuery.refetch(),
    onOpenAdd: () => openDialog(null, EMPTY_SCHEDULE_FORM),
    onOpenEdit: handleOpenEdit,
    onCloseDialog: () => setDialog(null),
    onFieldChange: handleFieldChange,
    onSubmit: handleSubmit,
    onRequestDelete: (id: string) =>
      setDeleteTarget(items.find((s) => s.id === id) ?? null),
    onConfirmDelete: handleConfirmDelete,
    onCancelDelete: () => setDeleteTarget(null),
  };
}

export type SchedulesViewModel = ReturnType<typeof useSchedulesViewModel>;
export type ScheduleFieldChange = SchedulesViewModel['onFieldChange'];
