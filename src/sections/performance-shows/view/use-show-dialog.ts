'use client';

// ----------------------------------------------------------------------
// 회차 추가·수정 다이얼로그 ViewModel(FN-28). JSX 없음.
// - 실패(SHW_002 같은 날짜·시각 · SHW_003 좌석 축소 · 400 검증 · 404 CLS_001)는 다이얼로그 안 문구(서버 message)
//   — designer 시안 dialog-error, 입력을 잃지 않게.
// - 성공: 닫기, 수정이면 "저장되었습니다" 스낵바(D04 반 다이얼로그와 같음).
// ----------------------------------------------------------------------
import { useState } from 'react';

import {
  EMPTY_SHOW_FORM,
  toShowFormInput,
  type Show,
  type ShowFormInput,
} from '@/src/api/show-mapper';
import { useCreateShow, useSaveShow } from '@/src/api/show-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  hasShowFormError,
  NO_SHOW_FORM_ERRORS,
  validateShowForm,
  type ShowFormErrors,
} from '@/src/sections/performance-shows/utils/show-form';
import { MSG_COMMON } from '@/src/shared/messages/common';
import type { ShowStatus } from '@/src/types/booking';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export type ShowTextField = Exclude<
  keyof ShowFormInput,
  'bookingEnabled' | 'status'
>;

export interface ShowDialogState {
  isOpen: boolean;
  isEdit: boolean;
  form: ShowFormInput;
  errors: ShowFormErrors;
  submitError: string | null;
  isSubmitting: boolean;
  onOpenCreate: () => void;
  onOpenEdit: (show: Show) => void;
  onClose: () => void;
  onFieldChange: (field: ShowTextField, value: string) => void;
  onStatusChange: (status: ShowStatus) => void;
  onStopChange: (isStopped: boolean) => void;
  onSubmit: () => void;
}

export function useShowDialog(performanceId: string): ShowDialogState {
  const snackbar = useAppSnackbar();
  const createShow = useCreateShow(performanceId);
  const saveShow = useSaveShow();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ShowFormInput>(EMPTY_SHOW_FORM);
  const [errors, setErrors] = useState<ShowFormErrors>(NO_SHOW_FORM_ERRORS);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isSubmitting = createShow.isPending || saveShow.isPending;

  const open = (id: string | null, initial: ShowFormInput) => {
    setEditingId(id);
    setForm(initial);
    setErrors(NO_SHOW_FORM_ERRORS);
    setSubmitError(null);
    setIsOpen(true);
  };

  const handleSubmit = () => {
    const nextErrors = validateShowForm(form);
    setErrors(nextErrors);
    if (hasShowFormError(nextErrors) || isSubmitting) return;
    setSubmitError(null);
    const onSuccess = () => {
      setIsOpen(false);
      if (editingId) snackbar.success(MSG_COMMON.SAVED);
    };
    const onError = (error: unknown) =>
      setSubmitError(toApiErrorMessage(error));
    if (editingId) {
      saveShow.mutate({ id: editingId, input: form }, { onSuccess, onError });
    } else {
      createShow.mutate(form, { onSuccess, onError });
    }
  };

  return {
    isOpen,
    isEdit: editingId !== null,
    form,
    errors,
    submitError,
    isSubmitting,
    onOpenCreate: () => open(null, EMPTY_SHOW_FORM),
    onOpenEdit: (show) => open(show.id, toShowFormInput(show)),
    onClose: () => {
      if (!isSubmitting) setIsOpen(false);
    },
    onFieldChange: (field, value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (field in errors) setErrors((prev) => ({ ...prev, [field]: null }));
    },
    onStatusChange: (status) => setForm((prev) => ({ ...prev, status })),
    onStopChange: (isStopped) =>
      setForm((prev) => ({ ...prev, bookingEnabled: !isStopped })),
    onSubmit: handleSubmit,
  };
}
