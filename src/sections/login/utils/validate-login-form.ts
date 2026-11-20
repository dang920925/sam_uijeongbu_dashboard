// ----------------------------------------------------------------------
// 로그인 폼 검증(순수 함수) — 빈 값 문구는 현행 zod 스키마(Login.tsx:10-13).
// 아이디는 요청 때 앞뒤 공백을 지우므로(src/api/auth.ts) 공백만 있으면 빈 값으로 본다. 비밀번호는 그대로.
// ----------------------------------------------------------------------
import { MSG_D01 } from '@/src/shared/messages/d01';

export interface LoginFormValues {
  username: string;
  password: string;
}

export interface LoginFormErrors {
  username: string | null;
  password: string | null;
}

export const EMPTY_LOGIN_FORM: LoginFormValues = { username: '', password: '' };
export const NO_LOGIN_ERRORS: LoginFormErrors = {
  username: null,
  password: null,
};

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  return {
    username: values.username.trim() === '' ? MSG_D01.USERNAME_REQUIRED : null,
    password: values.password === '' ? MSG_D01.PASSWORD_REQUIRED : null,
  };
}

export function hasLoginFormError(errors: LoginFormErrors): boolean {
  return errors.username !== null || errors.password !== null;
}
