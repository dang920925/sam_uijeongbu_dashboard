// ----------------------------------------------------------------------
// (U48) 캐스트 사진 · 홈페이지 미리보기 계약(back-end §25.2~25.5 · §25.9). 화면 모델은 cast-photo-mapper 가 만든다.
// ----------------------------------------------------------------------

export interface GroupPhotoItemResponse {
  id: string;
  imageUrl: string;
  /** 0 = 대표 */
  sortOrder: number;
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
}

export interface RolePhotoItemResponse {
  roleId: string;
  actorProfileId: string;
  memberId: string;
  imageUrl: string;
}

/** `GET /admin/performances/{id}/cast-photos` */
export interface CastPhotosResponse {
  castPublic: boolean;
  groupPhotos: GroupPhotoItemResponse[];
  groupPhotoMax: number;
  /** 폐기 안 된 팀, 라벨 순 */
  teams: TeamPhotoItemResponse[];
  /** 사진이 있는 (배역, 배우)만 */
  rolePhotos: RolePhotoItemResponse[];
}

export interface SetPhotoRequest {
  imageUrl: string;
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

export type GroupPhoto = GroupPhotoItemResponse;
export type TeamPhoto = TeamPhotoItemResponse;

export interface CastPhotos {
  castPublic: boolean;
  /** sortOrder 순 */
  groupPhotos: GroupPhoto[];
  groupPhotoMax: number;
  teams: TeamPhoto[];
  /** `${roleId}:${actorProfileId}` → 이미지 URL */
  rolePhotoUrls: Record<string, string>;
}
