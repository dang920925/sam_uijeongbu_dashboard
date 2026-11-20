'use client';

// ----------------------------------------------------------------------
// 예매 설정 카드 ViewModel(FN-29). JSX 없음.
// - 폼 값 = 고친 값(draft) ?? 서버 값. 저장에 성공하면 draft 를 비워 저장된 서버 값으로 돌아간다(effect 동기화 없음).
// - "기본 문구 넣기" 는 환불 규정 칸을 기본 문구로 바꾼다(design §6 SCR-D11).
// - 저장 성공 스낵바 "저장되었습니다"(designer 시안 snackbar-saved), 실패는 서버 message 스낵바.
// ----------------------------------------------------------------------
import { useState } from 'react';

import type {
  BookingPolicy,
  BookingPolicyFormInput,
} from '@/src/api/booking-policy-mapper';
import { toBookingPolicyFormInput } from '@/src/api/booking-policy-mapper';
import { useSaveBookingPolicy } from '@/src/api/booking-policy-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  hasBookingPolicyFormError,
  NO_POLICY_FORM_ERRORS,
  validateBookingPolicyForm,
  type BookingPolicyFormErrors,
} from '@/src/sections/performance-shows/utils/booking-policy-form';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D11 } from '@/src/shared/messages/d11';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export type PolicyField = keyof BookingPolicyFormInput;

const EMPTY_POLICY_FORM: BookingPolicyFormInput = {
  inquiryContact: '',
  depositBank: '',
  depositAccountNumber: '',
  depositAccountHolder: '',
  maxTicketsPerBooking: '',
  depositDeadlineHours: '',
  refundPolicyText: '',
};

export interface BookingPolicyFormState {
  form: BookingPolicyFormInput;
  errors: BookingPolicyFormErrors;
  isSaving: boolean;
  onFieldChange: (field: PolicyField, value: string) => void;
  onInsertDefaultRefund: () => void;
  onSubmit: () => void;
}

export function useBookingPolicyForm(
  performanceId: string,
  policy: BookingPolicy | null
): BookingPolicyFormState {
  const snackbar = useAppSnackbar();
  const save = useSaveBookingPolicy(performanceId);
  const [draft, setDraft] = useState<BookingPolicyFormInput | null>(null);
  const [errors, setErrors] = useState<BookingPolicyFormErrors>(
    NO_POLICY_FORM_ERRORS
  );

  const base = policy ? toBookingPolicyFormInput(policy) : EMPTY_POLICY_FORM;
  const form = draft ?? base;

  const setField = (field: PolicyField, value: string) => {
    setDraft((prev) => ({ ...(prev ?? base), [field]: value }));
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = () => {
    const nextErrors = validateBookingPolicyForm(form);
    setErrors(nextErrors);
    if (hasBookingPolicyFormError(nextErrors) || save.isPending) return;
    save.mutate(form, {
      onSuccess: () => {
        setDraft(null);
        snackbar.success(MSG_COMMON.SAVED);
      },
      onError: (error) => snackbar.error(toApiErrorMessage(error)),
    });
  };

  return {
    form,
    errors,
    isSaving: save.isPending,
    onFieldChange: setField,
    onInsertDefaultRefund: () =>
      setField('refundPolicyText', MSG_D11.REFUND_DEFAULT_TEXT),
    onSubmit: handleSubmit,
  };
}
