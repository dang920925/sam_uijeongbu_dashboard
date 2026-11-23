// ----------------------------------------------------------------------
// (U48) 캐스트 사진 · 홈페이지 미리보기 요청 함수(back-end §25.2~25.5 · §25.9).
// 이미지는 기존 업로드(POST /admin/uploads purpose CAST_PHOTO → PUT)로 올린 publicUrl 을 imageUrl 로 보낸다.
// ----------------------------------------------------------------------
import {
  fromCastPhotosResponse,
  fromGroupPhotoItems,
} from '@/src/api/cast-photo-mapper';
import { endpoints } from '@/src/api/endpoints';
import {
  apiDelete,
  apiFetch,
  apiPatch,
  apiPost,
  apiPut,
} from '@/src/lib/api-client';
import type {
  CastPhotos,
  CastPhotosResponse,
  GroupPhoto,
  GroupPhotoListResponse,
  PreviewTokenResponse,
  ReorderGroupPhotosRequest,
  SetPhotoRequest,
  TeamPhotoItemResponse,
} from '@/src/types/cast-photo';

export async function fetchCastPhotos(
  performanceId: string
): Promise<CastPhotos> {
  return fromCastPhotosResponse(
    await apiFetch<CastPhotosResponse>(
      endpoints.performances.castPhotos(performanceId)
    )
  );
}

// ── 단체샷 ──

export async function addGroupPhoto(
  performanceId: string,
  imageUrl: string
): Promise<GroupPhoto[]> {
  const res = await apiPost<GroupPhotoListResponse>(
    endpoints.performances.groupPhotos(performanceId),
    { imageUrl } satisfies SetPhotoRequest
  );
  return fromGroupPhotoItems(res.items);
}

export async function reorderGroupPhotos(
  performanceId: string,
  photoIds: string[]
): Promise<GroupPhoto[]> {
  const res = await apiPut<GroupPhotoListResponse>(
    endpoints.performances.groupPhotosOrder(performanceId),
    { photoIds } satisfies ReorderGroupPhotosRequest
  );
  return fromGroupPhotoItems(res.items);
}

export async function replaceGroupPhoto(
  performanceId: string,
  photoId: string,
  imageUrl: string
): Promise<GroupPhoto[]> {
  const res = await apiPatch<GroupPhotoListResponse>(
    endpoints.performances.groupPhoto(performanceId, photoId),
    { imageUrl } satisfies SetPhotoRequest
  );
  return fromGroupPhotoItems(res.items);
}

export async function deleteGroupPhoto(
  performanceId: string,
  photoId: string
): Promise<void> {
  await apiDelete(endpoints.performances.groupPhoto(performanceId, photoId));
}

// ── 팀샷 ──

export async function saveTeamPhoto(
  teamAccountId: string,
  imageUrl: string
): Promise<TeamPhotoItemResponse> {
  return apiPut<TeamPhotoItemResponse>(
    endpoints.teamAccounts.photo(teamAccountId),
    { imageUrl } satisfies SetPhotoRequest
  );
}

export async function deleteTeamPhoto(teamAccountId: string): Promise<void> {
  await apiDelete(endpoints.teamAccounts.photo(teamAccountId));
}

// ── 배역 × 배우 개인샷 ──

export async function saveRolePhoto(
  roleId: string,
  actorProfileId: string,
  imageUrl: string
): Promise<void> {
  await apiPut(endpoints.roles.photo(roleId, actorProfileId), {
    imageUrl,
  } satisfies SetPhotoRequest);
}

export async function deleteRolePhoto(
  roleId: string,
  actorProfileId: string
): Promise<void> {
  await apiDelete(endpoints.roles.photo(roleId, actorProfileId));
}

// ── 미리보기 ──

export async function issuePreviewToken(
  performanceId: string
): Promise<PreviewTokenResponse> {
  return apiPost<PreviewTokenResponse>(
    endpoints.performances.previewToken(performanceId)
  );
}
