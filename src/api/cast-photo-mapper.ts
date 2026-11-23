// ----------------------------------------------------------------------
// (U48) 캐스트 사진 매퍼 — 계약(back-end §25.2·25.3) ↔ 화면 모델, 미리보기 주소(§25.9). 순수 함수(+ spec).
// (U51 §27) 크기는 둘 다 양의 정수일 때만(아니면 null = 근사 렌더), 비율은 허용 값만(아니면 원본·3:4).
// ----------------------------------------------------------------------
import type {
  CastCardRatioCode,
  CastPhotos,
  CastPhotosResponse,
  CropResponse,
  DisplayRatioCode,
  GroupPhoto,
  GroupPhotoItemResponse,
  PhotoDisplay,
  RolePhoto,
  RolePhotoItemResponse,
  TeamPhoto,
  TeamPhotoItemResponse,
} from '@/src/types/cast-photo';

const CARD_RATIOS: readonly CastCardRatioCode[] = ['3:4', '2:3', '4:5', '1:1'];
const DISPLAY_RATIOS: readonly DisplayRatioCode[] = [
  '16:9',
  '4:3',
  '1:1',
  '3:4',
];

export function toCastCardRatio(value: unknown): CastCardRatioCode {
  return CARD_RATIOS.find((r) => r === value) ?? '3:4';
}

export function toDisplayRatio(value: unknown): DisplayRatioCode | null {
  return DISPLAY_RATIOS.find((r) => r === value) ?? null;
}

function toCrop(value: CropResponse | null | undefined): CropResponse | null {
  if (!value) return null;
  const ok = [value.x, value.y, value.zoom].every(
    (n) => typeof n === 'number' && Number.isFinite(n)
  );
  return ok ? { x: value.x, y: value.y, zoom: value.zoom } : null;
}

export function toPhotoDisplay(
  width: number | null | undefined,
  height: number | null | undefined,
  crop: CropResponse | null | undefined
): PhotoDisplay {
  const valid = (n: number | null | undefined): n is number =>
    typeof n === 'number' && Number.isInteger(n) && n > 0;
  return {
    size: valid(width) && valid(height) ? { width, height } : null,
    crop: toCrop(crop),
  };
}

export function fromTeamPhotoItem(team: TeamPhotoItemResponse): TeamPhoto {
  return {
    teamAccountId: team.teamAccountId,
    label: team.label,
    photoUrl: team.photoUrl || null,
    display: toPhotoDisplay(team.photoWidth, team.photoHeight, team.photoCrop),
    ratio: toDisplayRatio(team.photoRatio),
  };
}

export function fromRolePhotoItem(photo: RolePhotoItemResponse): RolePhoto {
  return {
    imageUrl: photo.imageUrl,
    display: toPhotoDisplay(photo.width, photo.height, photo.crop),
    thumbCrop: toCrop(photo.thumbCrop),
  };
}

/** 배역 × 배우 사진 열쇠 */
export function rolePhotoKey(roleId: string, actorProfileId: string): string {
  return `${roleId}:${actorProfileId}`;
}

export function fromGroupPhotoItems(
  items: readonly GroupPhotoItemResponse[]
): GroupPhoto[] {
  return [...items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      sortOrder: item.sortOrder,
      display: toPhotoDisplay(item.width, item.height, item.crop),
      ratio: toDisplayRatio(item.displayRatio),
    }));
}

export function fromCastPhotosResponse(res: CastPhotosResponse): CastPhotos {
  return {
    castPublic: res.castPublic,
    castCardRatio: toCastCardRatio(res.castCardRatio),
    groupPhotos: fromGroupPhotoItems(res.groupPhotos ?? []),
    groupPhotoMax: res.groupPhotoMax,
    teams: (res.teams ?? []).map(fromTeamPhotoItem),
    rolePhotos: Object.fromEntries(
      (res.rolePhotos ?? []).map((photo) => [
        rolePhotoKey(photo.roleId, photo.actorProfileId),
        fromRolePhotoItem(photo),
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
