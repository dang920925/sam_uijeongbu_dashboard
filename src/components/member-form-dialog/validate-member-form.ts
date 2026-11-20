// 단원 폼 검증(순수 함수) — 이름 필수(현행 zod 규칙 Members.tsx:25).
import { MSG_MEMBER_FORM } from '@/src/shared/messages/member-form';
import type { MemberFormInput } from '@/src/types/member';

export interface MemberFormErrors {
  name: string | null;
}

export function validateMemberForm(input: MemberFormInput): MemberFormErrors {
  return {
    name: input.name.trim() === '' ? MSG_MEMBER_FORM.NAME_REQUIRED : null,
  };
}
