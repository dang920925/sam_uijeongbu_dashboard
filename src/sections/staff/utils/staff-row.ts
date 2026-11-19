// ----------------------------------------------------------------------
// 연출진 행 표시 모델 — 소개 없으면 "-", 노출 여부 → 라벨·tone(노출 success / 비노출 neutral, design SCR-D09).
// ----------------------------------------------------------------------
import { MSG_COMMON } from '@/src/shared/messages/common';
import type { Staff } from '@/src/types/content';
import type { LabelTone } from '@/src/theme/semantic';

export interface StaffRowModel {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string | null;
  displayOrder: number;
  visibleLabel: string;
  visibleTone: LabelTone;
}

export function toStaffRow(staff: Staff): StaffRowModel {
  return {
    id: staff.id,
    name: staff.name,
    role: staff.role,
    bio: staff.bio?.trim() ? staff.bio : MSG_COMMON.EMPTY_VALUE,
    photoUrl: staff.profileImageUrl,
    displayOrder: staff.displayOrder,
    visibleLabel: staff.isVisible ? MSG_COMMON.VISIBLE : MSG_COMMON.HIDDEN,
    visibleTone: staff.isVisible ? 'success' : 'neutral',
  };
}
