// ----------------------------------------------------------------------
// 배역 다이얼로그 검증(develop §11.7 — 이름 1~50, "출연" 묶음이면 이름 없음).
// ----------------------------------------------------------------------
import { MSG_D14 } from '@/src/shared/messages/d14';
import type { RoleFormInput } from '@/src/types/cast';

export const ROLE_NAME_MAX = 50;
export const ROLE_DESCRIPTION_MAX = 500;

export function validateRoleForm(input: RoleFormInput): string | null {
  return !input.isEnsemble && input.name.trim() === ''
    ? MSG_D14.ROLE_NAME_REQUIRED
    : null;
}
