// ----------------------------------------------------------------------
// SCR-D15 계정 설정 폼 — 값·오류 모양, 화면 검증(순수 함수).
// 규칙(develop §11.5 · J-44): 아이디 4~50자 [A-Za-z0-9._-], 새 비밀번호 15~200자(빈 칸 = 유지),
// 확인 불일치는 화면에서 먼저 막는다(design §6 SCR-D15). 바뀐 것이 없으면(ACC_003) 요청 전에 폼 위 알림.
// ----------------------------------------------------------------------
import { MSG_D15 } from '@/src/shared/messages/d15';

export type AccountField =
  'currentPassword' | 'newUsername' | 'newPassword' | 'confirmPassword';

export type AccountFormValues = Record<AccountField, string>;

/** 폼 위 알림(ACC_003 · 429 잠금 · 그 밖 검증·서버 오류) */
export interface AccountFormAlert {
  message: string;
  /** 429 잠금이면 자물쇠 아이콘(designer `locked` — SCR-D01 locked 와 같은 알림) */
  locked: boolean;
}

export interface AccountFormErrors {
  fields: Partial<Record<AccountField, string>>;
  alert: AccountFormAlert | null;
}

/** 필드 순서 — 첫 오류 칸으로 포커스를 옮길 때 쓴다 */
export const ACCOUNT_FIELDS: readonly AccountField[] = [
  'currentPassword',
  'newUsername',
  'newPassword',
  'confirmPassword',
];

/** 입력 id(라벨·aria-describedby·포커스) */
export const ACCOUNT_FIELD_IDS: Record<AccountField, string> = {
  currentPassword: 'account-current-password',
  newUsername: 'account-new-username',
  newPassword: 'account-new-password',
  confirmPassword: 'account-confirm-password',
};

export const NO_ACCOUNT_ERRORS: AccountFormErrors = { fields: {}, alert: null };

export const USERNAME_PATTERN = /^[A-Za-z0-9._-]{4,50}$/;
export const PASSWORD_MIN = 15;
export const PASSWORD_MAX = 200;

export function emptyAccountForm(username: string): AccountFormValues {
  return {
    currentPassword: '',
    newUsername: username,
    newPassword: '',
    confirmPassword: '',
  };
}

export function validateAccountForm(
  values: AccountFormValues,
  currentUsername: string | null
): AccountFormErrors {
  const fields: AccountFormErrors['fields'] = {};
  const username = values.newUsername.trim();
  if (values.currentPassword === '')
    fields.currentPassword = MSG_D15.CURRENT_PASSWORD_REQUIRED;
  if (!USERNAME_PATTERN.test(username))
    fields.newUsername = MSG_D15.INVALID_USERNAME;
  if (
    values.newPassword !== '' &&
    (values.newPassword.length < PASSWORD_MIN ||
      values.newPassword.length > PASSWORD_MAX)
  )
    fields.newPassword = MSG_D15.INVALID_PASSWORD;
  if (values.confirmPassword !== values.newPassword)
    fields.confirmPassword = MSG_D15.MISMATCH;

  const noChange =
    Object.keys(fields).length === 0 &&
    currentUsername !== null &&
    username === currentUsername &&
    values.newPassword === '';
  return {
    fields,
    alert: noChange ? { message: MSG_D15.NO_CHANGE, locked: false } : null,
  };
}

export function hasAccountError(errors: AccountFormErrors): boolean {
  return errors.alert !== null || Object.keys(errors.fields).length > 0;
}

/** 첫 오류 칸(필드 순서) — 폼 위 알림만 있으면 null */
export function firstErrorField(
  errors: AccountFormErrors
): AccountField | null {
  return ACCOUNT_FIELDS.find((field) => errors.fields[field]) ?? null;
}

/** 입력의 aria-describedby — 도움말(`{id}-helper`)·오류(`{id}-error`) 중 있는 것(FieldNotes 와 같은 id) */
export function describedByOf(
  fieldId: string,
  hasHelper: boolean,
  error: string | undefined
): string | undefined {
  const ids = [
    hasHelper ? `${fieldId}-helper` : null,
    error ? `${fieldId}-error` : null,
  ].filter((id): id is string => id !== null);
  return ids.length > 0 ? ids.join(' ') : undefined;
}
