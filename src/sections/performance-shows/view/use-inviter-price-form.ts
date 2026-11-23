'use client';

// ----------------------------------------------------------------------
// 가격 카드 ViewModel(U41 design §17 SCR-D11). JSX 없음.
// - 폼 값 = 고친 값(draft) ?? 서버 값(GET …/inviter-prices). 저장 성공이면 draft 를 비워 서버 값으로 돌아간다.
// - 저장 = PUT …/inviter-prices { base, samRelated } → 회차 준비 상태(basePrice·samRelatedPrice)도 함께 갱신(booking 무효화).
// ----------------------------------------------------------------------
import { useState } from 'react';

import {
  useInviterPrices,
  useSaveInviterPrices,
} from '@/src/api/price-tier-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  hasInviterPriceError,
  NO_INVITER_PRICE_ERRORS,
  toInviterPriceForm,
  toInviterPricesRequest,
  validateInviterPriceForm,
  type InviterPriceField,
  type InviterPriceFormErrors,
  type InviterPriceFormInput,
} from '@/src/sections/performance-shows/utils/inviter-price-form';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export interface InviterPriceFormState {
  form: InviterPriceFormInput;
  errors: InviterPriceFormErrors;
  isSaving: boolean;
  onFieldChange: (field: InviterPriceField, value: string) => void;
  onSubmit: () => void;
}

export function useInviterPriceForm(performanceId: string) {
  const snackbar = useAppSnackbar();
  const query = useInviterPrices(performanceId);
  const save = useSaveInviterPrices(performanceId);
  const [draft, setDraft] = useState<InviterPriceFormInput | null>(null);
  const [errors, setErrors] = useState<InviterPriceFormErrors>(
    NO_INVITER_PRICE_ERRORS
  );
  const form = draft ?? toInviterPriceForm(query.data ?? null);

  const state: InviterPriceFormState = {
    form,
    errors,
    isSaving: save.isPending,
    onFieldChange: (field, value) => {
      setDraft((prev) => ({ ...(prev ?? form), [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: null }));
    },
    onSubmit: () => {
      const next = validateInviterPriceForm(form);
      setErrors(next);
      if (hasInviterPriceError(next) || save.isPending) return;
      save.mutate(toInviterPricesRequest(form), {
        onSuccess: () => {
          setDraft(null);
          snackbar.success(MSG_COMMON.SAVED);
        },
        onError: (error) => snackbar.error(toApiErrorMessage(error)),
      });
    },
  };
  return { query, state };
}
