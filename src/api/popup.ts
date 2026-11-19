// ----------------------------------------------------------------------
// 팝업 요청 함수(FN-17) — develop §3.4 `/admin/popups`(비페이지 목록 `{ items }`, createdAt desc).
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromAdminPopupItemResponse,
  toPopupUpsertRequest,
  type PopupFormInput,
} from '@/src/api/popup-mapper';
import { apiDelete, apiFetch, apiPatch, apiPost } from '@/src/lib/api-client';
import type { ItemsResponse } from '@/src/types/common';
import type { AdminPopupItemResponse, Popup } from '@/src/types/content';

export async function fetchPopups(): Promise<Popup[]> {
  const res = await apiFetch<ItemsResponse<AdminPopupItemResponse>>(
    endpoints.popups.list
  );
  return res.items.map(fromAdminPopupItemResponse);
}

export async function createPopup(input: PopupFormInput): Promise<Popup> {
  return fromAdminPopupItemResponse(
    await apiPost<AdminPopupItemResponse>(
      endpoints.popups.list,
      toPopupUpsertRequest(input)
    )
  );
}

export async function savePopup(
  id: string,
  input: PopupFormInput
): Promise<Popup> {
  return fromAdminPopupItemResponse(
    await apiPatch<AdminPopupItemResponse>(
      endpoints.popups.detail(id),
      toPopupUpsertRequest(input)
    )
  );
}

export async function deletePopup(id: string): Promise<void> {
  await apiDelete(endpoints.popups.detail(id));
}
