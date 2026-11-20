'use client';

// ----------------------------------------------------------------------
// SCR-D08 추가·수정 다이얼로그 상태(현행 동작 그대로 — 기존 ViewModel 에서 나눔).
// - "연결 반" 선택지가 고른 공연에 따라 바뀌어(usePerformanceClasses) 폼 값이 조회 조건이 된다.
//   공연을 바꾸면 연결 반은 비운다(D5).
// - 저장 실패(SCH_002·PERF_001 등)는 다이얼로그 안 문구, 성공은 닫고 스낵바 + onSaved(저장 결과 — J-23).
// JSX 없음.
// ----------------------------------------------------------------------
import { useMemo, useState } from 'react';

import { usePerformanceClasses } from '@/src/api/performance-queries';
import {
  EMPTY_SCHEDULE_FORM,
  type ScheduleFormInput,
} from '@/src/api/schedule-mapper';
import { useCreateSchedule, useSaveSchedule } from '@/src/api/schedule-queries';
import type { AppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  hasScheduleFormErrors,
  NO_SCHEDULE_FORM_ERRORS,
  validateScheduleForm,
  type ScheduleFormErrors,
} from '@/src/sections/schedules/utils/validate-schedule-form';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D08 } from '@/src/shared/messages/d08';
import type { Schedule } from '@/src/types/content';
import { toApiErrorMessage as toErrorMessage } from '@/src/utils/api-error-message';

/** null = 닫힘, editingId null = 추가 */
interface DialogState {
  editingId: string | null;
}

export function useScheduleForm(
  snackbar: AppSnackbar,
  onSaved: (schedule: Schedule) => void
) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [form, setForm] = useState<ScheduleFormInput>(EMPTY_SCHEDULE_FORM);
  const [errors, setErrors] = useState<ScheduleFormErrors>(
    NO_SCHEDULE_FORM_ERRORS
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const classesQuery = usePerformanceClasses(form.performanceId || null);
  const create = useCreateSchedule();
  const save = useSaveSchedule();

  const classOptions = useMemo(
    () =>
      (form.performanceId ? (classesQuery.data ?? []) : []).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [classesQuery.data, form.performanceId]
  );

  const open = (editingId: string | null, value: ScheduleFormInput) => {
    setForm(value);
    setErrors(NO_SCHEDULE_FORM_ERRORS);
    setSubmitError(null);
    setDialog({ editingId });
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
      onSuccess: (saved: Schedule) => {
        setDialog(null);
        snackbar.success(MSG_COMMON.SAVED);
        onSaved(saved);
      },
      onError: (error: unknown) => setSubmitError(toErrorMessage(error)),
    };
    if (dialog.editingId)
      save.mutate({ id: dialog.editingId, input: form }, callbacks);
    else create.mutate(form, callbacks);
  };

  const isEditing = Boolean(dialog?.editingId);
  return {
    open,
    isOpen: dialog !== null,
    title: isEditing ? MSG_D08.DIALOG_EDIT : MSG_D08.DIALOG_ADD,
    submitLabel: isEditing ? MSG_COMMON.SAVE : MSG_COMMON.ADD,
    form,
    errors,
    submitError,
    isSubmitting: create.isPending || save.isPending,
    classOptions,
    onFieldChange: handleFieldChange,
    onSubmit: handleSubmit,
    onClose: () => setDialog(null),
  };
}

export type ScheduleFormState = ReturnType<typeof useScheduleForm>;
