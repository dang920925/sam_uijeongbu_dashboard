// ----------------------------------------------------------------------
// 참여자 다이얼로그 검증(develop §17.3 — 직함 1~30 필수, 사람 = 연출진·단원 선택 또는 이름 입력 중 하나).
// ----------------------------------------------------------------------
import { MSG_D14 } from '@/src/shared/messages/d14';
import type { CreditFormInput } from '@/src/types/cast';

export const CREDIT_TITLE_MAX = 30;
export const CREDIT_NAME_MAX = 50;

export function validateCreditForm(input: CreditFormInput): string | null {
  if (input.title.trim() === '') return MSG_D14.CREDIT_TITLE_REQUIRED;
  const hasPerson =
    input.kind === 'staff'
      ? input.staffId !== null
      : input.kind === 'member'
        ? input.memberId !== null
        : input.displayName.trim() !== '';
  return hasPerson ? null : MSG_D14.CREDIT_PERSON_REQUIRED;
}
