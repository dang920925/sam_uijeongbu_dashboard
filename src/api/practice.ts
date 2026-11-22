// ----------------------------------------------------------------------
// 팀 계정·연습실 예약(관리) 요청 함수(U34 develop §18.2) — BFF `/api/backend/v1/admin/...`.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromAdminRoomReservationResponse,
  fromTeamAccountListResponse,
  fromTeamAccountResponse,
} from '@/src/api/practice-mapper';
import {
  apiDelete,
  apiFetch,
  apiPatch,
  apiPost,
  withQuery,
} from '@/src/lib/api-client';
import type { ItemsResponse } from '@/src/types/common';
import type {
  AdminRoomReservation,
  AdminRoomReservationResponse,
  TeamAccount,
  TeamAccountList,
  TeamAccountListResponse,
  TeamAccountResponse,
} from '@/src/types/practice';

export async function fetchTeamAccounts(
  performanceId: string
): Promise<TeamAccountList> {
  return fromTeamAccountListResponse(
    await apiFetch<TeamAccountListResponse>(
      endpoints.performances.teamAccounts(performanceId)
    )
  );
}

export async function createTeamAccount(
  performanceId: string
): Promise<TeamAccount> {
  return fromTeamAccountResponse(
    await apiPost<TeamAccountResponse>(
      endpoints.performances.teamAccounts(performanceId),
      {}
    )
  );
}

export async function updateTeamPrefix(
  performanceId: string,
  prefix: string
): Promise<TeamAccountList> {
  return fromTeamAccountListResponse(
    await apiPatch<TeamAccountListResponse>(
      endpoints.performances.teamPrefix(performanceId),
      { prefix }
    )
  );
}

export async function resetTeamPassword(id: string): Promise<TeamAccount> {
  return fromTeamAccountResponse(
    await apiPost<TeamAccountResponse>(
      endpoints.teamAccounts.resetPassword(id),
      {}
    )
  );
}

export async function setTeamAccountActive(
  id: string,
  isActive: boolean
): Promise<TeamAccount> {
  return fromTeamAccountResponse(
    await apiPatch<TeamAccountResponse>(endpoints.teamAccounts.detail(id), {
      isActive,
    })
  );
}

export async function fetchAdminRoomReservations(range: {
  from: string;
  to: string;
}): Promise<AdminRoomReservation[]> {
  const res = await apiFetch<ItemsResponse<AdminRoomReservationResponse>>(
    withQuery(endpoints.roomReservations.list, range)
  );
  return res.items.map(fromAdminRoomReservationResponse);
}

export async function deleteAdminRoomReservation(id: string): Promise<void> {
  await apiDelete(endpoints.roomReservations.detail(id));
}
