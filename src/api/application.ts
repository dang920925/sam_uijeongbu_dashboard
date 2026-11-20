// ----------------------------------------------------------------------
// 신청서 요청 함수(FN-13, D6 승인과 등록 분리) — develop §3.4 "신청서".
// 승인·거절은 상태만 바꾸고(단원 생성 없음), "단원으로 등록"은 별도 POST …/{id}/member 다.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromApplicationItemResponse,
  toRegisterMemberFromApplicationRequest,
} from '@/src/api/application-mapper';
import { fromMemberListItemResponse } from '@/src/api/member-mapper';
import { apiFetch, apiPost, withQuery } from '@/src/lib/api-client';
import type {
  Application,
  ApplicationActionResponse,
  ApplicationItemResponse,
  ApplicationListQuery,
  PendingCountResponse,
  RegisterMemberFromApplicationResponse,
} from '@/src/types/application';
import type { ApplicationType } from '@/src/types/codes';
import type { Paginated } from '@/src/types/common';
import type { Member, MemberFormInput } from '@/src/types/member';

export async function fetchApplications(
  query: ApplicationListQuery
): Promise<Paginated<Application>> {
  const res = await apiFetch<Paginated<ApplicationItemResponse>>(
    withQuery(endpoints.applications.list, query)
  );
  return { ...res, items: res.items.map(fromApplicationItemResponse) };
}

export async function fetchPendingApplicationCount(
  appType?: ApplicationType
): Promise<number> {
  const res = await apiFetch<PendingCountResponse>(
    withQuery(endpoints.applications.pendingCount, { appType })
  );
  return res.count;
}

export async function fetchApplication(id: string): Promise<Application> {
  return fromApplicationItemResponse(
    await apiFetch<ApplicationItemResponse>(endpoints.applications.detail(id))
  );
}

export async function approveApplication(id: string): Promise<Application> {
  const res = await apiPost<ApplicationActionResponse>(
    endpoints.applications.approve(id)
  );
  return fromApplicationItemResponse(res.application);
}

export async function rejectApplication(id: string): Promise<Application> {
  const res = await apiPost<ApplicationActionResponse>(
    endpoints.applications.reject(id)
  );
  return fromApplicationItemResponse(res.application);
}

export interface RegisteredMemberResult {
  application: Application;
  member: Member;
}

export async function registerMemberFromApplication(
  id: string,
  input: MemberFormInput
): Promise<RegisteredMemberResult> {
  const res = await apiPost<RegisterMemberFromApplicationResponse>(
    endpoints.applications.member(id),
    toRegisterMemberFromApplicationRequest(input)
  );
  return {
    application: fromApplicationItemResponse(res.application),
    member: fromMemberListItemResponse(res.member),
  };
}
