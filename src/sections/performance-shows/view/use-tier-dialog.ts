'use client';

// ----------------------------------------------------------------------
// 가격 등급 추가·수정 다이얼로그 ViewModel(develop §11.10). JSX 없음.
// - 실패(400 COMMON_001 — 0원·이름 중복 등, 404 TIER_001)는 다이얼로그 안 문구(서버 message).
// - 성공: 닫기, 수정이면 "저장되었습니다" 스낵바(회차 다이얼로그와 같음).
// ----------------------------------------------------------------------
import { useState } from 'react';

import {
  EMPTY_PRICE_TIER_FORM,
  toPriceTierFormInput,
  type PriceTier,
  type PriceTierFormInput,
} from '@/src/api/price-tier-mapper';
import {
  useCreatePriceTier,
  useSavePriceTier,
} from '@/src/api/price-tier-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  hasPriceTierFormError,
  NO_TIER_FORM_ERRORS,
  validatePriceTierForm,
  type PriceTierFormErrors,
} from '@/src/sections/performance-shows/utils/tier-form';
import { MSG_COMMON } from '@/src/shared/messages/common';
import type { PriceTierVisibility } from '@/src/types/booking';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export interface TierDialogState {
  isOpen: boolean;
  isEdit: boolean;
  form: PriceTierFormInput;
  errors: PriceTierFormErrors;
  submitError: string | null;
  isSubmitting: boolean;
  onOpenCreate: () => void;
  onOpenEdit: (tier: PriceTier) => void;
  onClose: () => void;
  onFieldChange: (field: 'name' | 'price', value: string) => void;
  onVisibilityChange: (visibility: PriceTierVisibility) => void;
  onActiveChange: (isActive: boolean) => void;
  onSubmit: () => void;
}

/** nextSortOrder: 새 등급을 맨 뒤에 두는 순서(utils/tier-order nextTierSortOrder) */
export function useTierDialog(
  performanceId: string,
  nextSortOrder: number
): TierDialogState {
  const snackbar = useAppSnackbar();
  const createTier = useCreatePriceTier(performanceId);
  const saveTier = useSavePriceTier();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PriceTierFormInput>(EMPTY_PRICE_TIER_FORM);
  const [errors, setErrors] =
    useState<PriceTierFormErrors>(NO_TIER_FORM_ERRORS);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isSubmitting = createTier.isPending || saveTier.isPending;

  const open = (id: string | null, initial: PriceTierFormInput) => {
    setEditingId(id);
    setForm(initial);
    setErrors(NO_TIER_FORM_ERRORS);
    setSubmitError(null);
    setIsOpen(true);
  };

  const handleSubmit = () => {
    const nextErrors = validatePriceTierForm(form);
    setErrors(nextErrors);
    if (hasPriceTierFormError(nextErrors) || isSubmitting) return;
    setSubmitError(null);
    const onSuccess = () => {
      setIsOpen(false);
      if (editingId) snackbar.success(MSG_COMMON.SAVED);
    };
    const onError = (error: unknown) =>
      setSubmitError(toApiErrorMessage(error));
    if (editingId) {
      saveTier.mutate({ id: editingId, input: form }, { onSuccess, onError });
    } else {
      createTier.mutate(
        { input: form, sortOrder: nextSortOrder },
        { onSuccess, onError }
      );
    }
  };

  return {
    isOpen,
    isEdit: editingId !== null,
    form,
    errors,
    submitError,
    isSubmitting,
    onOpenCreate: () => open(null, EMPTY_PRICE_TIER_FORM),
    onOpenEdit: (tier) => open(tier.id, toPriceTierFormInput(tier)),
    onClose: () => {
      if (!isSubmitting) setIsOpen(false);
    },
    onFieldChange: (field, value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: null }));
    },
    onVisibilityChange: (visibility) =>
      setForm((prev) => ({ ...prev, visibility })),
    onActiveChange: (isActive) => setForm((prev) => ({ ...prev, isActive })),
    onSubmit: handleSubmit,
  };
}
