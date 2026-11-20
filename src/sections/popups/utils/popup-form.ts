// ----------------------------------------------------------------------
// 팝업 폼 검증(순수 함수) — develop §3.4 PopupUpsert · §3.1 오류 문구.
// - 이미지 없음 → UPL_003 "이미지를 업로드해주세요." · 종료일 < 시작일 → POP_002 "종료일은 시작일 이후여야 합니다."
// - 링크 https 아님(≤500)·날짜 비어 있음 → 계약에 전용 문구가 없어 COMMON_001 기본 문구(자체 결정 — front-end-dashboard.md §11.2).
// ----------------------------------------------------------------------
import type { PopupFormInput } from '@/src/api/popup-mapper';
import { MSG_UPLOAD } from '@/src/shared/messages/common';
import { MSG_D10 } from '@/src/shared/messages/d10';

export interface PopupFormErrors {
  imageUrl: string | null;
  linkUrl: string | null;
  startDate: string | null;
  endDate: string | null;
}

export const POPUP_LINK_MAX = 500;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const EMPTY_POPUP_FORM: PopupFormInput = {
  imageUrl: null,
  linkUrl: '',
  startDate: '',
  endDate: '',
  isActive: true,
};

function validateLink(linkUrl: string): string | null {
  const value = linkUrl.trim();
  if (value === '') return null;
  return /^https:\/\/\S+$/.test(value) && value.length <= POPUP_LINK_MAX
    ? null
    : MSG_D10.INVALID_INPUT;
}

export function validatePopupForm(input: PopupFormInput): PopupFormErrors {
  const startValid = DATE.test(input.startDate);
  const endValid = DATE.test(input.endDate);
  return {
    imageUrl: input.imageUrl ? null : MSG_UPLOAD.REQUIRED,
    linkUrl: validateLink(input.linkUrl),
    startDate: startValid ? null : MSG_D10.INVALID_INPUT,
    endDate: !endValid
      ? MSG_D10.INVALID_INPUT
      : startValid && input.endDate < input.startDate
        ? MSG_D10.END_BEFORE_START
        : null,
  };
}

export function hasPopupFormError(errors: PopupFormErrors): boolean {
  return Object.values(errors).some((e) => e !== null);
}
