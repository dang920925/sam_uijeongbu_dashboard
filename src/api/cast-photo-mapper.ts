// ----------------------------------------------------------------------
// (U48) 캐스트 사진 매퍼 — 계약(back-end §25.2·25.3) ↔ 화면 모델, 미리보기 주소(§25.9). 순수 함수(+ spec).
// ----------------------------------------------------------------------
import type {
  CastPhotos,
  CastPhotosResponse,
  GroupPhoto,
  GroupPhotoItemResponse,
} from '@/src/types/cast-photo';

/** 배역 × 배우 사진 열쇠 */
export function rolePhotoKey(roleId: string, actorProfileId: string): string {
  return `${roleId}:${actorProfileId}`;
}

export function fromGroupPhotoItems(
  items: readonly GroupPhotoItemResponse[]
): GroupPhoto[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function fromCastPhotosResponse(res: CastPhotosResponse): CastPhotos {
  return {
    castPublic: res.castPublic,
    groupPhotos: fromGroupPhotoItems(res.groupPhotos ?? []),
    groupPhotoMax: res.groupPhotoMax,
    teams: (res.teams ?? []).map((team) => ({
      teamAccountId: team.teamAccountId,
      label: team.label,
      photoUrl: team.photoUrl || null,
    })),
    rolePhotoUrls: Object.fromEntries(
      (res.rolePhotos ?? []).map((photo) => [
        rolePhotoKey(photo.roleId, photo.actorProfileId),
        photo.imageUrl,
      ])
    ),
  };
}

/** 홈페이지 미리보기 주소 — `{홈페이지}/works/{id}?preview=<token>` */
export function toPreviewUrl(
  clientUrl: string,
  performanceId: string,
  token: string
): string {
  const base = clientUrl.replace(/\/+$/, '');
  return `${base}/works/${encodeURIComponent(performanceId)}?preview=${encodeURIComponent(token)}`;
}
