// ----------------------------------------------------------------------
// 배역·캐스팅·참여자 요청 함수(R3 — develop §11.7 · §17.3 · §17.5).
// 작품 쪽(SCR-D14)과 배우 쪽(SCR-D05)이 같은 테이블을 본다 — 배우 추가는 둘 다 `POST /members/{id}/cast-roles`.
// ----------------------------------------------------------------------
import {
  fromAdminCreditResponse,
  fromAdminRoleResponse,
} from '@/src/api/cast-mapper';
import { endpoints } from '@/src/api/endpoints';
import {
  apiDelete,
  apiFetch,
  apiPatch,
  apiPost,
  apiPut,
} from '@/src/lib/api-client';
import type {
  AdminCredit,
  AdminCreditResponse,
  AdminRole,
  AdminRoleResponse,
  CastActorRequest,
  CreditCreateRequest,
  CreditPatchRequest,
  MemberCast,
  MemberCastCreateRequest,
  MemberCreditCreateRequest,
  MemberSamCredits,
  RoleCreateRequest,
  RolePatchRequest,
  ShowCastCell,
  ShowCastGrid,
} from '@/src/types/cast';
import type { ItemsResponse } from '@/src/types/common';

// ── 배역 ──

export async function fetchRoles(performanceId: string): Promise<AdminRole[]> {
  const res = await apiFetch<ItemsResponse<AdminRoleResponse>>(
    endpoints.performances.roles(performanceId)
  );
  return res.items.map(fromAdminRoleResponse);
}

export async function createRole(
  performanceId: string,
  body: RoleCreateRequest
): Promise<AdminRole> {
  return fromAdminRoleResponse(
    await apiPost<AdminRoleResponse>(
      endpoints.performances.roles(performanceId),
      body
    )
  );
}

export async function patchRole(
  id: string,
  body: RolePatchRequest
): Promise<AdminRole> {
  return fromAdminRoleResponse(
    await apiPatch<AdminRoleResponse>(endpoints.roles.detail(id), body)
  );
}

export async function deleteRole(id: string): Promise<void> {
  await apiDelete(endpoints.roles.detail(id));
}

export async function reorderRoles(
  performanceId: string,
  roleIds: string[]
): Promise<AdminRole[]> {
  const res = await apiPut<ItemsResponse<AdminRoleResponse>>(
    endpoints.performances.rolesOrder(performanceId),
    { roleIds }
  );
  return res.items.map(fromAdminRoleResponse);
}

export async function replaceDefaultCast(
  roleId: string,
  actors: CastActorRequest[]
): Promise<AdminRole> {
  return fromAdminRoleResponse(
    await apiPut<AdminRoleResponse>(endpoints.roles.defaultCast(roleId), {
      actors,
    })
  );
}

// ── 회차 지정 ──

export async function fetchShowCastGrid(
  performanceId: string
): Promise<ShowCastGrid> {
  return apiFetch<ShowCastGrid>(
    endpoints.performances.showCasts(performanceId)
  );
}

export async function replaceShowCast(
  showId: string,
  roleId: string,
  actors: CastActorRequest[]
): Promise<ShowCastCell> {
  return apiPut<ShowCastCell>(endpoints.showRoleCast(showId, roleId), {
    actors,
  });
}

export async function clearShowCast(
  showId: string,
  roleId: string
): Promise<void> {
  await apiDelete(endpoints.showRoleCast(showId, roleId));
}

// ── 참여자 ──

export async function fetchCredits(
  performanceId: string
): Promise<AdminCredit[]> {
  const res = await apiFetch<ItemsResponse<AdminCreditResponse>>(
    endpoints.performances.credits(performanceId)
  );
  return res.items.map(fromAdminCreditResponse);
}

export async function createCredit(
  performanceId: string,
  body: CreditCreateRequest
): Promise<AdminCredit> {
  return fromAdminCreditResponse(
    await apiPost<AdminCreditResponse>(
      endpoints.performances.credits(performanceId),
      body
    )
  );
}

export async function patchCredit(
  id: string,
  body: CreditPatchRequest
): Promise<AdminCredit> {
  return fromAdminCreditResponse(
    await apiPatch<AdminCreditResponse>(endpoints.credits.detail(id), body)
  );
}

export async function deleteCredit(id: string): Promise<void> {
  await apiDelete(endpoints.credits.detail(id));
}

export async function reorderCredits(
  performanceId: string,
  creditIds: string[]
): Promise<AdminCredit[]> {
  const res = await apiPut<ItemsResponse<AdminCreditResponse>>(
    endpoints.performances.creditsOrder(performanceId),
    { creditIds }
  );
  return res.items.map(fromAdminCreditResponse);
}

// ── 배우 쪽 ──

export async function fetchMemberSamCredits(
  memberId: string
): Promise<MemberSamCredits> {
  return apiFetch<MemberSamCredits>(endpoints.memberCast.samCredits(memberId));
}

export async function addMemberCast(
  memberId: string,
  body: MemberCastCreateRequest
): Promise<MemberCast> {
  return apiPost<MemberCast>(endpoints.memberCast.castRoles(memberId), body);
}

export async function removeMemberCast(
  memberId: string,
  roleId: string
): Promise<{ showOverrideCount: number }> {
  return apiDelete<{ showOverrideCount: number }>(
    endpoints.memberCast.castRole(memberId, roleId)
  );
}

export async function addMemberCredit(
  memberId: string,
  body: MemberCreditCreateRequest
): Promise<AdminCredit> {
  return fromAdminCreditResponse(
    await apiPost<AdminCreditResponse>(
      endpoints.memberCast.credits(memberId),
      body
    )
  );
}

// ── 공개 스위치 ──

/** 캐스트·참여자 홈페이지 공개(develop §17.3 — PATCH /admin/performances/{id} 에 castPublic 만) */
export async function saveCastPublic(
  performanceId: string,
  castPublic: boolean
): Promise<void> {
  await apiPatch(endpoints.performances.detail(performanceId), { castPublic });
}
