// ----------------------------------------------------------------------
// 연출진 요청 함수(FN-16) — develop §3.4 `/admin/staff`(비페이지 목록 `{ items }`, displayOrder asc).
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromAdminStaffItemResponse,
  toStaffUpsertRequest,
  type StaffFormInput,
} from '@/src/api/staff-mapper';
import { apiDelete, apiFetch, apiPatch, apiPost } from '@/src/lib/api-client';
import type { ItemsResponse } from '@/src/types/common';
import type { AdminStaffItemResponse, Staff } from '@/src/types/content';

export async function fetchStaffList(): Promise<Staff[]> {
  const res = await apiFetch<ItemsResponse<AdminStaffItemResponse>>(
    endpoints.staff.list
  );
  return res.items.map(fromAdminStaffItemResponse);
}

export async function createStaff(input: StaffFormInput): Promise<Staff> {
  return fromAdminStaffItemResponse(
    await apiPost<AdminStaffItemResponse>(
      endpoints.staff.list,
      toStaffUpsertRequest(input)
    )
  );
}

export async function saveStaff(
  id: string,
  input: StaffFormInput
): Promise<Staff> {
  return fromAdminStaffItemResponse(
    await apiPatch<AdminStaffItemResponse>(
      endpoints.staff.detail(id),
      toStaffUpsertRequest(input)
    )
  );
}

export async function deleteStaff(id: string): Promise<void> {
  await apiDelete(endpoints.staff.detail(id));
}
