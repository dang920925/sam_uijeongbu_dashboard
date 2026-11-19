// ----------------------------------------------------------------------
// 팝업 매퍼(FN-17). 링크는 앞뒤 공백 제거 후 빈 값이면 null. 날짜는 'YYYY-MM-DD'(KST 달력 날짜) 그대로.
// ----------------------------------------------------------------------
import type {
  AdminPopupItemResponse,
  Popup,
  PopupUpsertRequest,
} from '@/src/types/content';

/** 다이얼로그 폼 값 — 이미지는 업로드 전 null */
export interface PopupFormInput {
  imageUrl: string | null;
  linkUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export function fromAdminPopupItemResponse(res: AdminPopupItemResponse): Popup {
  return {
    id: res.id,
    imageUrl: res.imageUrl,
    linkUrl: res.linkUrl ?? null,
    startDate: res.startDate,
    endDate: res.endDate,
    isActive: res.isActive,
    overlapsActive: res.overlapsActive,
    createdAt: res.createdAt,
  };
}

/** 폼 → 요청. 이미지 필수 검사는 폼 검증(validatePopupForm)이 먼저 한다 */
export function toPopupUpsertRequest(
  input: PopupFormInput
): PopupUpsertRequest {
  const linkUrl = input.linkUrl.trim();
  return {
    imageUrl: input.imageUrl ?? '',
    linkUrl: linkUrl === '' ? null : linkUrl,
    startDate: input.startDate,
    endDate: input.endDate,
    isActive: input.isActive,
  };
}

/** 수정 다이얼로그 초기값 */
export function toPopupFormInput(popup: Popup): PopupFormInput {
  return {
    imageUrl: popup.imageUrl,
    linkUrl: popup.linkUrl ?? '',
    startDate: popup.startDate,
    endDate: popup.endDate,
    isActive: popup.isActive,
  };
}
