'use client';

// ----------------------------------------------------------------------
// (U48) 캐스트 사진 쿼리 키와 훅. 키는 ROOT_KEYS.cast 아래 — 배역·캐스트가 바뀌면(배역 삭제 등) 사진도 같이 다시 받는다.
// 사진 변경 뒤에는 캐스트 사진 키만 무효화한다(배역·격자는 그대로).
// 미리보기 토큰은 캐시하지 않는다(30분 단발 — 매번 새로 발급).
// (U51) 올리기 저장은 '조정 창을 열 대상'을 돌려준다(올린 직후 자동으로 열기). 위치·비율 저장 · 배역 카드 비율도 같은 키만 무효화.
// ----------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addGroupPhoto,
  deleteGroupPhoto,
  deleteRolePhoto,
  deleteTeamPhoto,
  fetchCastPhotos,
  issuePreviewToken,
  reorderGroupPhotos,
  replaceGroupPhoto,
  saveCastCardRatio,
  saveGroupPhotoDisplay,
  saveRolePhoto,
  saveRolePhotoDisplay,
  saveTeamPhoto,
  saveTeamPhotoDisplay,
  type UploadedPhoto,
} from '@/src/api/cast-photo';
import { ROOT_KEYS } from '@/src/api/root-keys';
import type {
  CastCardRatioCode,
  GroupPhotoDisplayRequest,
  RolePhotoDisplayRequest,
  TeamPhotoDisplayRequest,
} from '@/src/types/cast-photo';

export const castPhotoKeys = {
  all: [...ROOT_KEYS.cast, 'photos'] as const,
  detail: (performanceId: string) =>
    [...castPhotoKeys.all, performanceId] as const,
};

export function useCastPhotos(performanceId: string) {
  return useQuery({
    queryKey: castPhotoKeys.detail(performanceId),
    queryFn: () => fetchCastPhotos(performanceId),
  });
}

function useInvalidatePhotos(performanceId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: castPhotoKeys.detail(performanceId),
    });
}

/** 사진 저장 한 종류 — 단체샷 추가·교체, 팀샷, 배역 사진 */
export type CastPhotoTarget =
  | { kind: 'group-add' }
  | { kind: 'group-replace'; photoId: string }
  | { kind: 'team'; teamAccountId: string }
  | { kind: 'role'; roleId: string; actorProfileId: string };

/** (U51) 보이는 비율·위치를 정할 사진 하나 */
export type CastPhotoDisplayTarget =
  | { kind: 'group'; photoId: string }
  | { kind: 'team'; teamAccountId: string }
  | { kind: 'role'; roleId: string; actorProfileId: string };

/** 올리기·교체 저장 → 조정 창을 열 대상(새 단체샷은 목록 맨 뒤) */
export function useSaveCastPhoto(performanceId: string) {
  const invalidate = useInvalidatePhotos(performanceId);
  return useMutation({
    mutationFn: async ({
      target,
      photo,
    }: {
      target: CastPhotoTarget;
      photo: UploadedPhoto;
    }): Promise<CastPhotoDisplayTarget | null> => {
      if (target.kind === 'group-add') {
        const list = await addGroupPhoto(performanceId, photo);
        const added = list.at(-1);
        return added ? { kind: 'group', photoId: added.id } : null;
      }
      if (target.kind === 'group-replace') {
        await replaceGroupPhoto(performanceId, target.photoId, photo);
        return { kind: 'group', photoId: target.photoId };
      }
      if (target.kind === 'team') {
        await saveTeamPhoto(target.teamAccountId, photo);
        return target;
      }
      await saveRolePhoto(target.roleId, target.actorProfileId, photo);
      return target;
    },
    onSettled: invalidate,
  });
}

/** 조정 창 [저장] — 값만 `…/display` PATCH(보낸 필드만 바뀜) */
export type CastPhotoDisplaySave =
  | { kind: 'group'; photoId: string; body: GroupPhotoDisplayRequest }
  | { kind: 'team'; teamAccountId: string; body: TeamPhotoDisplayRequest }
  | {
      kind: 'role';
      roleId: string;
      actorProfileId: string;
      body: RolePhotoDisplayRequest;
    };

export function useSaveCastPhotoDisplay(performanceId: string) {
  const invalidate = useInvalidatePhotos(performanceId);
  return useMutation({
    mutationFn: async (save: CastPhotoDisplaySave): Promise<void> => {
      if (save.kind === 'group') {
        await saveGroupPhotoDisplay(performanceId, save.photoId, save.body);
      } else if (save.kind === 'team') {
        await saveTeamPhotoDisplay(save.teamAccountId, save.body);
      } else {
        await saveRolePhotoDisplay(save.roleId, save.actorProfileId, save.body);
      }
    },
    onSettled: invalidate,
  });
}

export function useSaveCastCardRatio(performanceId: string) {
  const invalidate = useInvalidatePhotos(performanceId);
  return useMutation({
    mutationFn: (ratio: CastCardRatioCode) =>
      saveCastCardRatio(performanceId, ratio),
    onSettled: invalidate,
  });
}

/** 지울 사진 — 단체샷·팀샷·배역 사진 */
export type CastPhotoDeleteTarget =
  | { kind: 'group'; photoId: string }
  | { kind: 'team'; teamAccountId: string }
  | { kind: 'role'; roleId: string; actorProfileId: string };

export function useDeleteCastPhoto(performanceId: string) {
  const invalidate = useInvalidatePhotos(performanceId);
  return useMutation({
    mutationFn: async (target: CastPhotoDeleteTarget): Promise<void> => {
      if (target.kind === 'group') {
        await deleteGroupPhoto(performanceId, target.photoId);
      } else if (target.kind === 'team') {
        await deleteTeamPhoto(target.teamAccountId);
      } else {
        await deleteRolePhoto(target.roleId, target.actorProfileId);
      }
    },
    onSettled: invalidate,
  });
}

export function useReorderGroupPhotos(performanceId: string) {
  const invalidate = useInvalidatePhotos(performanceId);
  return useMutation({
    mutationFn: (photoIds: string[]) =>
      reorderGroupPhotos(performanceId, photoIds),
    onSettled: invalidate,
  });
}

export function useIssuePreviewToken(performanceId: string) {
  return useMutation({
    mutationFn: () => issuePreviewToken(performanceId),
  });
}
