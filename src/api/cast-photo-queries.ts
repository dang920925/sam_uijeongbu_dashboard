'use client';

// ----------------------------------------------------------------------
// (U48) 캐스트 사진 쿼리 키와 훅. 키는 ROOT_KEYS.cast 아래 — 배역·캐스트가 바뀌면(배역 삭제 등) 사진도 같이 다시 받는다.
// 사진 변경 뒤에는 캐스트 사진 키만 무효화한다(배역·격자는 그대로).
// 미리보기 토큰은 캐시하지 않는다(30분 단발 — 매번 새로 발급).
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
  saveRolePhoto,
  saveTeamPhoto,
} from '@/src/api/cast-photo';
import { ROOT_KEYS } from '@/src/api/root-keys';

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

export function useSaveCastPhoto(performanceId: string) {
  const invalidate = useInvalidatePhotos(performanceId);
  return useMutation({
    mutationFn: async ({
      target,
      imageUrl,
    }: {
      target: CastPhotoTarget;
      imageUrl: string;
    }): Promise<void> => {
      if (target.kind === 'group-add') {
        await addGroupPhoto(performanceId, imageUrl);
      } else if (target.kind === 'group-replace') {
        await replaceGroupPhoto(performanceId, target.photoId, imageUrl);
      } else if (target.kind === 'team') {
        await saveTeamPhoto(target.teamAccountId, imageUrl);
      } else {
        await saveRolePhoto(target.roleId, target.actorProfileId, imageUrl);
      }
    },
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
