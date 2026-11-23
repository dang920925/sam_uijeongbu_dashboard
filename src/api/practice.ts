// ----------------------------------------------------------------------
// 팀 계정·연습실 예약(관리) 요청 함수(U34 develop §18.2) — BFF `/api/backend/v1/admin/...`.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromAdminRoomReservationResponse,
  fromTeamAccountListResponse,
  fromTeamAccountResponse,
  fromTeamRosterResponse,
} from '@/src/api/practice-mapper';
import {
  apiDelete,
  apiFetch,
  apiPatch,
  apiPost,
  apiPut,
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
  TeamRoster,
  TeamRosterResponse,
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

/** (U45) 팀 구성 표 — 폐기 안 된 팀 × 캐스트 배우 */
export async function fetchTeamRoster(
  performanceId: string
): Promise<TeamRoster> {
  return fromTeamRosterResponse(
    await apiFetch<TeamRosterResponse>(
      endpoints.performances.teamMembers(performanceId)
    )
  );
}

/** (U45) 팀에 배우 넣기(멱등) */
export async function addTeamMember(
  teamAccountId: string,
  memberId: string
): Promise<void> {
  await apiPut(endpoints.teamAccounts.member(teamAccountId, memberId), {});
}

/** (U45) 팀에서 배우 빼기(멱등) */
export async function removeTeamMember(
  teamAccountId: string,
  memberId: string
): Promise<void> {
  await apiDelete(endpoints.teamAccounts.member(teamAccountId, memberId));
}
