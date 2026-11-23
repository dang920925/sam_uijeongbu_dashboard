// ----------------------------------------------------------------------
// (U48) 캐스트 사진 · 홈페이지 미리보기 요청 함수(back-end §25.2~25.5 · §25.9).
// 이미지는 기존 업로드(POST /admin/uploads purpose CAST_PHOTO → PUT)로 올린 publicUrl 을 imageUrl 로 보낸다.
// (U51 §27) 올리기·교체에 축소 후 크기(width·height — 둘 다 또는 생략)를 함께 보내고,
// 조정 창 [저장]은 `…/display` PATCH(보낸 필드만), 배역 카드 비율은 공연 하나 PUT.
// ----------------------------------------------------------------------
import {
  fromCastPhotosResponse,
  fromGroupPhotoItems,
  fromRolePhotoItem,
  fromTeamPhotoItem,
  toCastCardRatio,
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
  AddGroupPhotoRequest,
  CastCardRatioBody,
  CastCardRatioCode,
  CastPhotos,
  CastPhotosResponse,
  GroupPhoto,
  GroupPhotoDisplayRequest,
  GroupPhotoListResponse,
  PreviewTokenResponse,
  ReorderGroupPhotosRequest,
  RolePhoto,
  RolePhotoDisplayRequest,
  RolePhotoItemResponse,
  SetPhotoRequest,
  TeamPhoto,
  TeamPhotoDisplayRequest,
  TeamPhotoItemResponse,
} from '@/src/types/cast-photo';

/** 올린 사진 — 공개 URL + 축소 후 크기(모르면 null) */
export interface UploadedPhoto {
  imageUrl: string;
  width: number | null;
  height: number | null;
}

/** 크기는 둘 다 있을 때만 보낸다(§27.3 — 하나만 보내면 400) */
export function toSetPhotoRequest(photo: UploadedPhoto): SetPhotoRequest {
  return photo.width && photo.height
    ? { imageUrl: photo.imageUrl, width: photo.width, height: photo.height }
    : { imageUrl: photo.imageUrl };
}

export async function fetchCastPhotos(
  performanceId: string
): Promise<CastPhotos> {
  return fromCastPhotosResponse(
    await apiFetch<CastPhotosResponse>(
      endpoints.performances.castPhotos(performanceId)
    )
  );
}

export async function saveCastCardRatio(
  performanceId: string,
  castCardRatio: CastCardRatioCode
): Promise<CastCardRatioCode> {
  const res = await apiPut<CastCardRatioBody>(
    endpoints.performances.castCardRatio(performanceId),
    { castCardRatio } satisfies CastCardRatioBody
  );
  return toCastCardRatio(res.castCardRatio);
}

// ── 단체샷 ──

export async function addGroupPhoto(
  performanceId: string,
  photo: UploadedPhoto
): Promise<GroupPhoto[]> {
  const res = await apiPost<GroupPhotoListResponse>(
    endpoints.performances.groupPhotos(performanceId),
    toSetPhotoRequest(photo) satisfies AddGroupPhotoRequest
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
  photo: UploadedPhoto
): Promise<GroupPhoto[]> {
  const res = await apiPatch<GroupPhotoListResponse>(
    endpoints.performances.groupPhoto(performanceId, photoId),
    toSetPhotoRequest(photo)
  );
  return fromGroupPhotoItems(res.items);
}

export async function saveGroupPhotoDisplay(
  performanceId: string,
  photoId: string,
  body: GroupPhotoDisplayRequest
): Promise<GroupPhoto[]> {
  const res = await apiPatch<GroupPhotoListResponse>(
    endpoints.performances.groupPhotoDisplay(performanceId, photoId),
    body
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
  photo: UploadedPhoto
): Promise<TeamPhoto> {
  return fromTeamPhotoItem(
    await apiPut<TeamPhotoItemResponse>(
      endpoints.teamAccounts.photo(teamAccountId),
      toSetPhotoRequest(photo)
    )
  );
}

export async function saveTeamPhotoDisplay(
  teamAccountId: string,
  body: TeamPhotoDisplayRequest
): Promise<TeamPhoto> {
  return fromTeamPhotoItem(
    await apiPatch<TeamPhotoItemResponse>(
      endpoints.teamAccounts.photoDisplay(teamAccountId),
      body
    )
  );
}

export async function deleteTeamPhoto(teamAccountId: string): Promise<void> {
  await apiDelete(endpoints.teamAccounts.photo(teamAccountId));
}

// ── 배역 × 배우 개인샷 ──

export async function saveRolePhoto(
  roleId: string,
  actorProfileId: string,
  photo: UploadedPhoto
): Promise<void> {
  await apiPut(
    endpoints.roles.photo(roleId, actorProfileId),
    toSetPhotoRequest(photo)
  );
}

export async function saveRolePhotoDisplay(
  roleId: string,
  actorProfileId: string,
  body: RolePhotoDisplayRequest
): Promise<RolePhoto> {
  return fromRolePhotoItem(
    await apiPatch<RolePhotoItemResponse>(
      endpoints.roles.photoDisplay(roleId, actorProfileId),
      body
    )
  );
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
