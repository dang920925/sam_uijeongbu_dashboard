// ----------------------------------------------------------------------
// (U51) '보이는 위치 조정' 창 상태·파생값 — 순수 함수(designer §21.2 · back-end §27.4).
// - 배역 사진: 비율 = 공연의 배역 카드 비율(카드 위쪽에서 고름). 맞출 대상 [카드 | 썸네일 ○](썸네일은 1:1, 따로 안 맞추면 crop 그대로).
// - 단체샷·팀샷: 사진마다 보이는 비율(원본 | 16:9 | 4:3 | 1:1 | 3:4). 원본이면 자르지 않음(틀·확대 없음).
// - 저장 본문: 가운데(50·50·1)는 null 로 보낸다(계약상 같은 뜻). 원본 비율이면 crop 도 null.
// ----------------------------------------------------------------------
import { rolePhotoKey } from '@/src/api/cast-photo-mapper';
import type {
  CastPhotoDisplaySave,
  CastPhotoDisplayTarget,
} from '@/src/api/cast-photo-queries';
import {
  aspectRatioOf,
  CROP_DEFAULT,
  cropRect,
  framePlacement,
  isBlurry,
  isCentered,
  moveCrop,
  normalizeCrop,
  ratioOf,
  sanitizeCrop,
  thumbRect,
  zoomCrop,
  type CropBox,
  type PhotoAspect,
  type PhotoCrop,
  type PhotoSize,
  type RoleCardRatio,
} from '@/src/sections/performance-cast/utils/photo-crop';
import { MSG_D14 } from '@/src/shared/messages/d14';
import type { AdminRole } from '@/src/types/cast';
import type { CastPhotos } from '@/src/types/cast-photo';

export type CropEditorKind = 'role' | 'group' | 'team';
export type CropEditTarget = 'card' | 'thumb';

/** 창을 열 때 필요한 것 — 저장된 값 그대로 */
export interface CropEditorRequest {
  /** 창 다시 그리기 열쇠(대상 + 이미지) */
  key: string;
  target: CastPhotoDisplayTarget;
  kind: CropEditorKind;
  /** 부제의 '누구' — "에반 · 당병진 · 배역 사진" 등 */
  who: string;
  imageUrl: string;
  /** 원본(축소 후) 크기 — 모르면 null(창이 사진을 열어 잰다) */
  size: PhotoSize | null;
  /** 올린 직후 자동으로 열렸는지 */
  isNew: boolean;
  cardRatio: RoleCardRatio;
  aspect: PhotoAspect;
  crop: PhotoCrop | null;
  thumbCrop: PhotoCrop | null;
  /** 미리보기 이름표(배역 사진만) */
  roleLabel: string | null;
  actorName: string | null;
}

export interface CropEditorState {
  target: CropEditTarget;
  aspect: PhotoAspect;
  crop: PhotoCrop;
  thumbCrop: PhotoCrop | null;
}

export function initialEditorState(
  request: CropEditorRequest
): CropEditorState {
  return {
    target: 'card',
    aspect: request.aspect,
    crop: sanitizeCrop(request.crop),
    thumbCrop: request.thumbCrop ? sanitizeCrop(request.thumbCrop) : null,
  };
}

/** 지금 비율(가로/세로). 원본이면 null */
export function editorRatio(
  request: CropEditorRequest,
  state: CropEditorState
): number | null {
  return request.kind === 'role'
    ? ratioOf(request.cardRatio)
    : aspectRatioOf(state.aspect);
}

export interface CropEditorModel {
  ratio: number | null;
  card: CropBox | null;
  thumb: CropBox | null;
  /** 지금 끌고 확대하는 대상의 값 */
  active: PhotoCrop;
  activeRatio: number | null;
  cardFrame: ReturnType<typeof framePlacement> | null;
  thumbFrame: ReturnType<typeof framePlacement> | null;
  isBlurry: boolean;
  isThumbAuto: boolean;
  canAdjust: boolean;
}

export function toEditorModel(
  request: CropEditorRequest,
  state: CropEditorState,
  size: PhotoSize
): CropEditorModel {
  const ratio = editorRatio(request, state);
  const card = ratio === null ? null : cropRect(size, ratio, state.crop);
  const thumb =
    request.kind === 'role'
      ? thumbRect(size, state.crop, state.thumbCrop)
      : null;
  const isThumb = state.target === 'thumb' && request.kind === 'role';
  const activeRatio = isThumb ? 1 : ratio;
  const rawActive = isThumb ? (state.thumbCrop ?? state.crop) : state.crop;
  return {
    ratio,
    card,
    thumb,
    active:
      activeRatio === null
        ? rawActive
        : normalizeCrop(size, activeRatio, rawActive),
    activeRatio,
    cardFrame: card ? framePlacement(size, card) : null,
    thumbFrame: thumb ? framePlacement(size, thumb) : null,
    isBlurry: card !== null && isBlurry(card),
    isThumbAuto: state.thumbCrop === null,
    canAdjust: activeRatio !== null,
  };
}

function updateActive(
  request: CropEditorRequest,
  state: CropEditorState,
  change: (crop: PhotoCrop, ratio: number) => PhotoCrop
): CropEditorState {
  if (state.target === 'thumb' && request.kind === 'role') {
    return { ...state, thumbCrop: change(state.thumbCrop ?? state.crop, 1) };
  }
  const ratio = editorRatio(request, state);
  if (ratio === null) return state;
  return { ...state, crop: change(state.crop, ratio) };
}

export function moveActive(
  request: CropEditorRequest,
  state: CropEditorState,
  size: PhotoSize,
  dxPercent: number,
  dyPercent: number
): CropEditorState {
  return updateActive(request, state, (crop, ratio) =>
    moveCrop(size, ratio, crop, dxPercent, dyPercent)
  );
}

export function zoomActive(
  request: CropEditorRequest,
  state: CropEditorState,
  size: PhotoSize,
  zoom: number
): CropEditorState {
  return updateActive(request, state, (crop, ratio) =>
    zoomCrop(size, ratio, crop, zoom)
  );
}

/** [가운데로 되돌리기] — 썸네일 탭이면 썸네일만 */
export function resetActive(
  request: CropEditorRequest,
  state: CropEditorState
): CropEditorState {
  return updateActive(request, state, () => ({ ...CROP_DEFAULT }));
}

export function setAspect(
  state: CropEditorState,
  aspect: PhotoAspect
): CropEditorState {
  return { ...state, aspect };
}

/** 썸네일을 카드에 맞추기(자동) — 따로 맞춘 값을 지운다 */
export function clearThumb(state: CropEditorState): CropEditorState {
  return { ...state, thumbCrop: null, target: 'thumb' };
}

function cropOrNull(
  size: PhotoSize | null,
  ratio: number,
  crop: PhotoCrop
): PhotoCrop | null {
  const value = size ? normalizeCrop(size, ratio, crop) : crop;
  return isCentered(value) ? null : value;
}

/** [저장] → `…/display` PATCH 본문(보낸 필드만 바뀜) */
export function toDisplaySave(
  request: CropEditorRequest,
  state: CropEditorState,
  size: PhotoSize | null
): CastPhotoDisplaySave {
  const target = request.target;
  if (target.kind === 'role') {
    return {
      ...target,
      body: {
        crop: cropOrNull(size, ratioOf(request.cardRatio), state.crop),
        thumbCrop: state.thumbCrop
          ? size
            ? normalizeCrop(size, 1, state.thumbCrop)
            : state.thumbCrop
          : null,
      },
    };
  }
  const ratio = aspectRatioOf(state.aspect);
  const displayRatio = state.aspect === 'ORIGINAL' ? null : state.aspect;
  const crop = ratio === null ? null : cropOrNull(size, ratio, state.crop);
  return target.kind === 'group'
    ? { ...target, body: { displayRatio, crop } }
    : { ...target, body: { photoRatio: displayRatio, photoCrop: crop } };
}

/** 대상 사진 → 창 요청(사진이 없으면 null — 다시 받는 중이면 받은 뒤 열린다) */
export function toCropEditorRequest(
  photos: CastPhotos,
  roles: readonly AdminRole[],
  target: CastPhotoDisplayTarget,
  isNew: boolean
): CropEditorRequest | null {
  const base = {
    target,
    isNew,
    cardRatio: photos.castCardRatio,
    roleLabel: null,
    actorName: null,
    thumbCrop: null,
  };
  if (target.kind === 'role') {
    const photo =
      photos.rolePhotos[rolePhotoKey(target.roleId, target.actorProfileId)];
    if (!photo) return null;
    const role = roles.find((r) => r.id === target.roleId);
    const label = role?.name ?? MSG_D14.ENSEMBLE;
    const name =
      role?.defaultCast.find((a) => a.actorProfileId === target.actorProfileId)
        ?.name ?? '';
    return {
      ...base,
      key: `role:${target.roleId}:${target.actorProfileId}:${photo.imageUrl}:${isNew}`,
      kind: 'role',
      who: MSG_D14.CROP_WHO_ROLE(label, name),
      imageUrl: photo.imageUrl,
      size: photo.display.size,
      aspect: 'ORIGINAL',
      crop: photo.display.crop,
      thumbCrop: photo.thumbCrop,
      roleLabel: label,
      actorName: name,
    };
  }
  if (target.kind === 'group') {
    const index = photos.groupPhotos.findIndex((g) => g.id === target.photoId);
    const photo = photos.groupPhotos[index];
    if (!photo) return null;
    return {
      ...base,
      key: `group:${photo.id}:${photo.imageUrl}:${isNew}`,
      kind: 'group',
      who: MSG_D14.CROP_WHO_GROUP(index + 1),
      imageUrl: photo.imageUrl,
      size: photo.display.size,
      aspect: photo.ratio ?? 'ORIGINAL',
      crop: photo.display.crop,
    };
  }
  const team = photos.teams.find(
    (t) => t.teamAccountId === target.teamAccountId
  );
  if (!team?.photoUrl) return null;
  return {
    ...base,
    key: `team:${team.teamAccountId}:${team.photoUrl}:${isNew}`,
    kind: 'team',
    who: MSG_D14.CROP_WHO_TEAM(team.label),
    imageUrl: team.photoUrl,
    size: team.display.size,
    aspect: team.ratio ?? 'ORIGINAL',
    crop: team.display.crop,
  };
}
