// ----------------------------------------------------------------------
// (U48) 캐스트 사진 · 홈페이지 미리보기 계약(back-end §25.2~25.5 · §25.9). 화면 모델은 cast-photo-mapper 가 만든다.
// (U51) 보이는 비율·위치(크롭) 필드 — back-end §27(비파괴: 비율·초점·확대 값만).
// ----------------------------------------------------------------------

/** 초점 중심(원본 기준 %, 0~100) + 확대(1~3). null = 가운데 · 1 */
export interface CropResponse {
  x: number;
  y: number;
  zoom: number;
}

/** 공연 하나의 배역 카드 비율 */
export type CastCardRatioCode = '3:4' | '2:3' | '4:5' | '1:1';
/** 단체샷·팀샷 보이는 비율(null = 원본 그대로) */
export type DisplayRatioCode = '16:9' | '4:3' | '1:1' | '3:4';

export interface GroupPhotoItemResponse {
  id: string;
  imageUrl: string;
  /** 0 = 대표 */
  sortOrder: number;
  width?: number | null;
  height?: number | null;
  displayRatio?: DisplayRatioCode | null;
  crop?: CropResponse | null;
}

export interface GroupPhotoListResponse {
  items: GroupPhotoItemResponse[];
  maxCount: number;
}

export interface TeamPhotoItemResponse {
  teamAccountId: string;
  label: string;
  /** 없으면 null */
  photoUrl: string | null;
  photoWidth?: number | null;
  photoHeight?: number | null;
  photoRatio?: DisplayRatioCode | null;
  photoCrop?: CropResponse | null;
}

export interface RolePhotoItemResponse {
  roleId: string;
  actorProfileId: string;
  memberId: string;
  imageUrl: string;
  width?: number | null;
  height?: number | null;
  crop?: CropResponse | null;
  thumbCrop?: CropResponse | null;
}

/** `GET /admin/performances/{id}/cast-photos` */
export interface CastPhotosResponse {
  castPublic: boolean;
  /** (U51) 배역 카드 비율 — 항상 값 */
  castCardRatio?: CastCardRatioCode;
  groupPhotos: GroupPhotoItemResponse[];
  groupPhotoMax: number;
  /** 폐기 안 된 팀, 라벨 순 */
  teams: TeamPhotoItemResponse[];
  /** 사진이 있는 (배역, 배우)만 */
  rolePhotos: RolePhotoItemResponse[];
}

export interface SetPhotoRequest {
  imageUrl: string;
  /** (U51) 축소 후 크기 — 둘 다 보내거나 둘 다 생략 */
  width?: number;
  height?: number;
}

/** 새 단체샷(POST) — 비율도 함께 정할 수 있다 */
export interface AddGroupPhotoRequest extends SetPhotoRequest {
  displayRatio?: DisplayRatioCode | null;
}

/** `PATCH /admin/roles/{roleId}/photos/{actorProfileId}/display` — 보낸 필드만 */
export interface RolePhotoDisplayRequest {
  crop?: CropResponse | null;
  thumbCrop?: CropResponse | null;
}

/** `PATCH /admin/performances/{id}/group-photos/{photoId}/display` */
export interface GroupPhotoDisplayRequest {
  displayRatio?: DisplayRatioCode | null;
  crop?: CropResponse | null;
}

/** `PATCH /admin/team-accounts/{id}/photo/display` */
export interface TeamPhotoDisplayRequest {
  photoRatio?: DisplayRatioCode | null;
  photoCrop?: CropResponse | null;
}

/** `PUT /admin/performances/{id}/cast-card-ratio` 요청·응답 */
export interface CastCardRatioBody {
  castCardRatio: CastCardRatioCode;
}

export interface ReorderGroupPhotosRequest {
  photoIds: string[];
}

/** `POST /admin/performances/{id}/preview-token` 201 */
export interface PreviewTokenResponse {
  token: string;
  /** ISO 8601 UTC(발급 + 30분) */
  expiresAt: string;
}

// ── 화면 모델 ──────────────────────────────────────────────

/** 원본 크기(모르면 null) · 비율(null = 원본) · 위치(null = 가운데) */
export interface PhotoDisplay {
  size: { width: number; height: number } | null;
  crop: CropResponse | null;
}

export interface GroupPhoto {
  id: string;
  imageUrl: string;
  sortOrder: number;
  display: PhotoDisplay;
  ratio: DisplayRatioCode | null;
}

export interface TeamPhoto {
  teamAccountId: string;
  label: string;
  photoUrl: string | null;
  display: PhotoDisplay;
  ratio: DisplayRatioCode | null;
}

export interface RolePhoto {
  imageUrl: string;
  display: PhotoDisplay;
  thumbCrop: CropResponse | null;
}

export interface CastPhotos {
  castPublic: boolean;
  castCardRatio: CastCardRatioCode;
  /** sortOrder 순 */
  groupPhotos: GroupPhoto[];
  groupPhotoMax: number;
  teams: TeamPhoto[];
  /** `${roleId}:${actorProfileId}` → 배역 사진 */
  rolePhotos: Record<string, RolePhoto>;
}
