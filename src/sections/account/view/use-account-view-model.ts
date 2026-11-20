'use client';

// ----------------------------------------------------------------------
// SCR-D15 계정 설정 ViewModel — 현재 아이디(GET /auth/me)·폼 값·검증·저장·보기 토글. JSX 없음.
// - 새 아이디 칸은 현재 아이디로 채운다(values 가 null 이면 me 에서 만든다 → 성공 뒤 새 아이디로 다시 채워짐).
// - 첫 저장 전에는 검증하지 않고, 그 뒤로는 입력할 때마다 다시 검증한다(로그인 화면과 같은 동작).
// - 오류가 있으면 첫 오류 칸으로 포커스(designer 2.2 "첫 오류 칸으로 포커스"). 폼 위 알림은 role=alert.
// - 성공: 스낵바 "계정 정보가 바뀌었습니다." + 비밀번호 칸 비움·보기 끔. 이 기기는 새 쿠키로 로그인 유지(J-45).
// - 401 은 전역 처리(로그인 이동)를 막지 않는다.
// ----------------------------------------------------------------------
import { useState } from 'react';

import { useMe, useUpdateAccount } from '@/src/api/account-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  ACCOUNT_FIELD_IDS,
  emptyAccountForm,
  firstErrorField,
  hasAccountError,
  NO_ACCOUNT_ERRORS,
  validateAccountForm,
  type AccountField,
  type AccountFormErrors,
  type AccountFormValues,
} from '@/src/sections/account/utils/account-form';
import { resolveAccountError } from '@/src/sections/account/utils/resolve-account-error';
import { MSG_D15 } from '@/src/shared/messages/d15';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export type PasswordField = Exclude<AccountField, 'newUsername'>;

const HIDDEN: Record<PasswordField, boolean> = {
  currentPassword: false,
  newPassword: false,
  confirmPassword: false,
};

function focusFirstError(errors: AccountFormErrors) {
  const field = firstErrorField(errors);
  if (!field) return;
  requestAnimationFrame(() =>
    document.getElementById(ACCOUNT_FIELD_IDS[field])?.focus()
  );
}

export function useAccountViewModel() {
  const me = useMe();
  const mutation = useUpdateAccount();
  const snackbar = useAppSnackbar();
  const currentUsername = me.data?.username ?? null;
  const [edited, setEdited] = useState<AccountFormValues | null>(null);
  const [errors, setErrors] = useState<AccountFormErrors>(NO_ACCOUNT_ERRORS);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [visible, setVisible] = useState(HIDDEN);
  const values = edited ?? emptyAccountForm(currentUsername ?? '');
  const isSaving = mutation.isPending;

  const handleChange = (field: AccountField, value: string) => {
    const next = { ...values, [field]: value };
    setEdited(next);
    if (hasSubmitted) setErrors(validateAccountForm(next, currentUsername));
  };

  const handleSubmit = () => {
    if (isSaving) return;
    setHasSubmitted(true);
    const nextErrors = validateAccountForm(values, currentUsername);
    setErrors(nextErrors);
    if (hasAccountError(nextErrors)) {
      focusFirstError(nextErrors);
      return;
    }
    mutation.mutate(
      {
        currentPassword: values.currentPassword,
        newUsername: values.newUsername,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          setEdited(null);
          setErrors(NO_ACCOUNT_ERRORS);
          setHasSubmitted(false);
          setVisible(HIDDEN);
          snackbar.success(MSG_D15.SUCCESS);
        },
        onError: (error) => {
          const resolved = resolveAccountError(error);
          if (!resolved) return;
          setErrors(resolved);
          focusFirstError(resolved);
        },
      }
    );
  };

  return {
    status: me.isPending
      ? ('loading' as const)
      : me.isError
        ? ('error' as const)
        : ('ready' as const),
    loadErrorMessage: me.isError ? toApiErrorMessage(me.error) : '',
    onRetry: () => void me.refetch(),
    currentUsername: currentUsername ?? '',
    values,
    errors,
    visible,
    isSaving,
    onChange: handleChange,
    onToggleVisible: (field: PasswordField) =>
      setVisible((prev) => ({ ...prev, [field]: !prev[field] })),
    onSubmit: handleSubmit,
  };
}

export type AccountViewModel = ReturnType<typeof useAccountViewModel>;
