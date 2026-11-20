// ----------------------------------------------------------------------
// 연출진 매퍼(FN-16). 이름·역할은 앞뒤 공백 제거, 빈 소개는 null, 노출 순서는 0 이상 정수.
// ----------------------------------------------------------------------
import type {
  AdminStaffItemResponse,
  Staff,
  StaffUpsertRequest,
} from '@/src/types/content';

/** 다이얼로그 폼 값 — 노출 순서는 입력칸 문자열 그대로 들고 있다가 요청 때 정수로 바꾼다 */
export interface StaffFormInput {
  name: string;
  role: string;
  profileImageUrl: string | null;
  bio: string;
  displayOrder: string;
  isVisible: boolean;
}

export function fromAdminStaffItemResponse(res: AdminStaffItemResponse): Staff {
  return {
    id: res.id,
    name: res.name,
    role: res.role,
    profileImageUrl: res.profileImageUrl ?? null,
    bio: res.bio ?? null,
    displayOrder: res.displayOrder,
    isVisible: res.isVisible,
    createdAt: res.createdAt,
  };
}

/** 입력칸 문자열 → 0 이상 정수(숫자가 아니면 0) */
export function toDisplayOrder(value: string): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function toStaffUpsertRequest(
  input: StaffFormInput
): StaffUpsertRequest {
  const bio = input.bio.trim();
  return {
    name: input.name.trim(),
    role: input.role.trim(),
    profileImageUrl: input.profileImageUrl,
    bio: bio === '' ? null : bio,
    displayOrder: toDisplayOrder(input.displayOrder),
    isVisible: input.isVisible,
  };
}

/** 수정 다이얼로그 초기값 */
export function toStaffFormInput(staff: Staff): StaffFormInput {
  return {
    name: staff.name,
    role: staff.role,
    profileImageUrl: staff.profileImageUrl,
    bio: staff.bio ?? '',
    displayOrder: String(staff.displayOrder),
    isVisible: staff.isVisible,
  };
}
