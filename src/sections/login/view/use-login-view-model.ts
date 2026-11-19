'use client';

// ----------------------------------------------------------------------
// 로그인(SCR-D01) ViewModel — 입력값·검증·로그인 뮤테이션·이동. JSX 없음.
// - 첫 제출 전에는 검증하지 않고, 제출 뒤에는 입력할 때마다 다시 검증한다(현행 react-hook-form 기본 동작).
// - 401 은 useLoginMutation 의 meta 로 전역 리다이렉트를 끄고 화면 문구로 보인다(B7).
// - 잠금(429) 중에도 버튼을 막지 않는다(designer W3 확인 필요 8 기본안).
// - 성공하면 replace 로 요약(/)에 간다 — 뒤로 가기로 로그인 화면에 돌아오지 않게. 이동 중에는 로딩 유지.
// ----------------------------------------------------------------------
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { paths } from '@/app/paths';
import { useLoginMutation } from '@/src/api/auth-queries';
import { resolveLoginError } from '@/src/sections/login/utils/resolve-login-error';
import {
  EMPTY_LOGIN_FORM,
  hasLoginFormError,
  NO_LOGIN_ERRORS,
  validateLoginForm,
  type LoginFormErrors,
  type LoginFormValues,
} from '@/src/sections/login/utils/validate-login-form';

export function useLoginViewModel() {
  const router = useRouter();
  const mutation = useLoginMutation();
  const [values, setValues] = useState<LoginFormValues>(EMPTY_LOGIN_FORM);
  const [errors, setErrors] = useState<LoginFormErrors>(NO_LOGIN_ERRORS);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const isSubmitting = mutation.isPending || mutation.isSuccess;

  const handleChange = (field: keyof LoginFormValues, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (hasSubmitted) setErrors(validateLoginForm(next));
  };

  const handleSubmit = () => {
    setHasSubmitted(true);
    const nextErrors = validateLoginForm(values);
    setErrors(nextErrors);
    if (hasLoginFormError(nextErrors) || isSubmitting) return;
    mutation.mutate(values, {
      onSuccess: () => router.replace(paths.dashboard),
    });
  };

  return {
    values,
    errors,
    authError: resolveLoginError(mutation.error),
    isSubmitting,
    onUsernameChange: (value: string) => handleChange('username', value),
    onPasswordChange: (value: string) => handleChange('password', value),
    onSubmit: handleSubmit,
  };
}
