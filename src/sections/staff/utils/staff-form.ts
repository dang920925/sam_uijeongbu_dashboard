// ----------------------------------------------------------------------
// 연출진 폼 순수 함수 — 검증(이름·역할 필수, develop StaffUpsert name·role 1~50)과 새 연출진 기본값.
// 새 연출진의 노출 순서는 지금 목록의 가장 큰 값 + 1(빈 목록이면 0) — 맨 뒤에 붙는다(자체 결정).
// ----------------------------------------------------------------------
import type { StaffFormInput } from '@/src/api/staff-mapper';
import { invalidHistoryRows } from '@/src/sections/staff/utils/staff-history-form';
import { MSG_D09 } from '@/src/shared/messages/d09';

export interface StaffFormErrors {
  name: string | null;
  role: string | null;
  /** 연혁 줄마다 잘못됐는지(칸 테두리 표시) */
  histories: boolean[];
}

export const STAFF_TEXT_MAX = 50;
export const STAFF_BIO_MAX = 1000;

export function validateStaffForm(input: StaffFormInput): StaffFormErrors {
  return {
    name: input.name.trim() === '' ? MSG_D09.NAME_REQUIRED : null,
    role: input.role.trim() === '' ? MSG_D09.ROLE_REQUIRED : null,
    histories: invalidHistoryRows(input.histories),
  };
}

export function hasStaffFormError(errors: StaffFormErrors): boolean {
  return (
    errors.name !== null ||
    errors.role !== null ||
    errors.histories.some(Boolean)
  );
}

export function nextDisplayOrder(orders: number[]): number {
  return orders.length === 0 ? 0 : Math.max(...orders) + 1;
}

export function createEmptyStaffForm(displayOrder: number): StaffFormInput {
  return {
    name: '',
    role: '',
    profileImageUrl: null,
    bio: '',
    displayOrder: String(displayOrder),
    isVisible: true,
    histories: [],
  };
}
