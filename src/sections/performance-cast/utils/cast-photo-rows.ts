// ----------------------------------------------------------------------
// (U48) SCR-D14 '캐스트 사진' 카드 표시 모델(designer §19.4) — 순수 함수.
// - 단체샷: 순서(첫 장 = 대표) · ◀▶ 가능 여부 · 추가 자리(남은 장수).
// - 팀샷: 팀마다 1장(팀 인원 = 팀 구성 소속 수, 모르면 null).
// - 배역 사진: 배역 블록 × 기본 캐스트 배우 줄. 홈페이지 대체 표시 = 배역 사진 → 프로필 사진 → 실루엣,
//   비노출 배우는 '보이지 않음'. 보기 '사진 없음'은 배역 사진이 없는 줄만.
// - 올리는 중·실패 상태는 슬롯 열쇠(castPhotoSlotKey)로 붙인다.
// - (U51) 사진마다 보이는 비율·위치(display)를 함께 실어 카드 썸네일을 저장된 대로 자르고, '위치 조정됨/가운데' 를 가린다.
// ----------------------------------------------------------------------
import { rolePhotoKey } from '@/src/api/cast-photo-mapper';
import {
  aspectRatioOf,
  coverStyle,
  ratioOf,
} from '@/src/sections/performance-cast/utils/photo-crop';
import { MSG_D14 } from '@/src/shared/messages/d14';
import type { AdminRole } from '@/src/types/cast';
import type {
  CastCardRatioCode,
  CastPhotos,
  DisplayRatioCode,
  PhotoDisplay,
  RolePhoto,
} from '@/src/types/cast-photo';

export type PhotoUploadPhase = 'optimizing' | 'uploading' | 'saving' | 'error';

export interface PhotoUploadView {
  phase: PhotoUploadPhase;
  /** 0~100(올리는 중일 때) */
  progress: number;
  errorMessage: string | null;
  canRetry: boolean;
}

export type CastPhotoFilter = 'all' | 'missing';

/** 저장된 비율·위치대로 자른 모습 — 비율(가로/세로) + <img> 스타일 */
export interface CroppedView {
  ratio: number;
  style: ReturnType<typeof coverStyle>;
}

/** 홈페이지에 보이는 모양 */
export type ActorPhotoSource =
  'role' | 'profile' | 'silhouette' | 'hidden' | 'unknown';

export const castPhotoSlotKey = {
  groupAdd: 'group-add',
  group: (photoId: string) => `group:${photoId}`,
  team: (teamAccountId: string) => `team:${teamAccountId}`,
  role: (roleId: string, actorProfileId: string) =>
    `role:${roleId}:${actorProfileId}`,
};

export interface GroupPhotoTile {
  id: string;
  slotKey: string;
  imageUrl: string;
  /** '대표' | '2' … */
  orderLabel: string;
  position: number;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  upload: PhotoUploadView | null;
  /** 보이는 비율(null = 원본) */
  ratio: DisplayRatioCode | null;
  display: PhotoDisplay;
  /** 잘라 보기(원본이면 null) */
  cropped: CroppedView | null;
}

export interface TeamPhotoTile {
  teamAccountId: string;
  slotKey: string;
  label: string;
  memberCount: number | null;
  photoUrl: string | null;
  upload: PhotoUploadView | null;
  ratio: DisplayRatioCode | null;
  display: PhotoDisplay;
  cropped: CroppedView | null;
}

export interface ActorPhotoRow {
  slotKey: string;
  roleId: string;
  roleLabel: string;
  actorProfileId: string;
  memberId: string;
  name: string;
  teamLabels: string[];
  rolePhotoUrl: string | null;
  rolePhoto: RolePhoto | null;
  /** 위치를 가운데에서 옮겼거나 썸네일을 따로 맞춤 */
  isAdjusted: boolean;
  /** 배역 카드 비율로 자른 <img> 스타일(배역 사진이 없으면 null) */
  photoStyle: CroppedView['style'] | null;
  source: ActorPhotoSource;
  upload: PhotoUploadView | null;
}

export interface RolePhotoBlock {
  roleId: string;
  label: string;
  actorCount: number;
  rows: ActorPhotoRow[];
}

export interface CastPhotoBoard {
  groups: GroupPhotoTile[];
  groupAdd: {
    remaining: number;
    canAdd: boolean;
    upload: PhotoUploadView | null;
  };
  groupMax: number;
  teams: TeamPhotoTile[];
  blocks: RolePhotoBlock[];
  /** 배역 사진 올린 줄 / 전체 줄 */
  meter: { have: number; total: number };
  counts: { all: number; missing: number };
  hasActors: boolean;
  /** 배역 카드 비율(공연 하나) */
  cardRatio: CastCardRatioCode;
  /** 배역 카드 비율 값(가로/세로) */
  cardAspect: number;
}

export interface CastPhotoBoardInput {
  roles: readonly AdminRole[];
  photos: CastPhotos;
  /** memberId → 프로필 사진(없으면 null). 단원 목록을 못 받았으면 null */
  profileUrls: Record<string, string | null> | null;
  /** 팀 구성(teamAccountId → 소속 memberId). 못 받았으면 null */
  teamMembers: Record<string, readonly string[]> | null;
  uploads: Record<string, PhotoUploadView>;
  filter: CastPhotoFilter;
}

function sourceOf(
  isVisible: boolean,
  rolePhotoUrl: string | null,
  profileUrls: Record<string, string | null> | null,
  memberId: string
): ActorPhotoSource {
  if (!isVisible) return 'hidden';
  if (rolePhotoUrl) return 'role';
  if (!profileUrls) return 'unknown';
  return profileUrls[memberId] ? 'profile' : 'silhouette';
}

function croppedOf(
  ratio: DisplayRatioCode | null,
  display: PhotoDisplay
): CroppedView | null {
  const value = ratio ? aspectRatioOf(ratio) : null;
  return value === null
    ? null
    : { ratio: value, style: coverStyle(display.size, value, display.crop) };
}

function isAdjusted(photo: RolePhoto | null): boolean {
  if (!photo) return false;
  const crop = photo.display.crop;
  const moved =
    crop !== null && (crop.x !== 50 || crop.y !== 50 || crop.zoom !== 1);
  return moved || photo.thumbCrop !== null;
}

export function toCastPhotoBoard(input: CastPhotoBoardInput): CastPhotoBoard {
  const { photos, uploads } = input;
  const cardAspect = ratioOf(photos.castCardRatio);
  const upload = (key: string) => uploads[key] ?? null;
  const groupCount = photos.groupPhotos.length;

  const groups = photos.groupPhotos.map((photo, index) => ({
    id: photo.id,
    slotKey: castPhotoSlotKey.group(photo.id),
    imageUrl: photo.imageUrl,
    orderLabel: index === 0 ? MSG_D14.PHOTO_GROUP_MAIN : String(index + 1),
    position: index + 1,
    canMoveLeft: index > 0,
    canMoveRight: index < groupCount - 1,
    upload: upload(castPhotoSlotKey.group(photo.id)),
    ratio: photo.ratio,
    display: photo.display,
    cropped: croppedOf(photo.ratio, photo.display),
  }));
  const remaining = Math.max(0, photos.groupPhotoMax - groupCount);

  const teamLabelsOf = (memberId: string) =>
    input.teamMembers
      ? photos.teams
          .filter((team) =>
            input.teamMembers?.[team.teamAccountId]?.includes(memberId)
          )
          .map((team) => team.label)
      : [];

  const teams = photos.teams.map((team) => ({
    teamAccountId: team.teamAccountId,
    slotKey: castPhotoSlotKey.team(team.teamAccountId),
    label: team.label,
    memberCount: input.teamMembers
      ? (input.teamMembers[team.teamAccountId]?.length ?? 0)
      : null,
    photoUrl: team.photoUrl,
    upload: upload(castPhotoSlotKey.team(team.teamAccountId)),
    ratio: team.ratio,
    display: team.display,
    cropped: team.photoUrl ? croppedOf(team.ratio, team.display) : null,
  }));

  const allBlocks = input.roles
    .filter((role) => role.defaultCast.length > 0)
    .map((role) => {
      const label = role.name ?? MSG_D14.ENSEMBLE;
      const rows = role.defaultCast.map((actor) => {
        const rolePhoto =
          photos.rolePhotos[rolePhotoKey(role.id, actor.actorProfileId)] ??
          null;
        const rolePhotoUrl = rolePhoto?.imageUrl ?? null;
        const slotKey = castPhotoSlotKey.role(role.id, actor.actorProfileId);
        return {
          slotKey,
          roleId: role.id,
          roleLabel: label,
          actorProfileId: actor.actorProfileId,
          memberId: actor.memberId,
          name: actor.name,
          teamLabels: teamLabelsOf(actor.memberId),
          rolePhotoUrl,
          rolePhoto,
          isAdjusted: isAdjusted(rolePhoto),
          photoStyle: rolePhoto
            ? coverStyle(
                rolePhoto.display.size,
                cardAspect,
                rolePhoto.display.crop
              )
            : null,
          source: sourceOf(
            actor.isVisible,
            rolePhotoUrl,
            input.profileUrls,
            actor.memberId
          ),
          upload: upload(slotKey),
        };
      });
      return { roleId: role.id, label, actorCount: rows.length, rows };
    });

  const allRows = allBlocks.flatMap((block) => block.rows);
  const have = allRows.filter((row) => row.rolePhotoUrl !== null).length;
  const blocks =
    input.filter === 'missing'
      ? allBlocks
          .map((block) => ({
            ...block,
            rows: block.rows.filter((row) => row.rolePhotoUrl === null),
          }))
          .filter((block) => block.rows.length > 0)
      : allBlocks;

  return {
    groups,
    groupAdd: {
      remaining,
      canAdd: remaining > 0,
      upload: upload(castPhotoSlotKey.groupAdd),
    },
    groupMax: photos.groupPhotoMax,
    teams,
    blocks,
    meter: { have, total: allRows.length },
    counts: { all: allRows.length, missing: allRows.length - have },
    hasActors: allRows.length > 0,
    cardRatio: photos.castCardRatio,
    cardAspect,
  };
}
