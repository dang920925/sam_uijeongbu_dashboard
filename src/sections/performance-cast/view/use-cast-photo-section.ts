'use client';

// ----------------------------------------------------------------------
// (U48) SCR-D14 '캐스트 사진' 카드 ViewModel — JSX 없음.
// - 조회: 캐스트 사진(GET cast-photos) + 배역(같은 화면 쿼리) + 배우 단원 프로필 사진(단원 목록 — 배우 고르기와 같은 키)
//   + 팀 구성(팀 라벨·인원). 단원·팀 구성 조회가 실패해도 카드는 보이고 대체 표시만 '모름'으로.
// - 올리기: 슬롯마다 기존 업로드(자동 축소 → 서명 URL PUT, purpose CAST_PHOTO) → 저장 API. 슬롯별 상태(줄이는 중·
//   올리는 중·실패 + 다시 시도). 저장이 끝나면 캐스트 사진을 다시 받아 슬롯 상태를 지운다.
// - 삭제는 확인 대화상자, 단체샷 ◀▶ 는 바뀐 순서 전체를 PUT order.
// - (U51) 올리기·교체에 축소 후 width·height 를 함께 보내고, 저장이 끝나면 '보이는 위치 조정' 창을 자동으로 연다.
//   카드의 [위치 조정]으로 언제든 다시 연다. [저장] = `…/display` PATCH + 스낵바. 배역 카드 비율은 공연 하나(PUT).
// ----------------------------------------------------------------------
import { useState } from 'react';

import {
  useCastPhotos,
  useDeleteCastPhoto,
  useReorderGroupPhotos,
  useSaveCastCardRatio,
  useSaveCastPhoto,
  useSaveCastPhotoDisplay,
  type CastPhotoDeleteTarget,
  type CastPhotoDisplaySave,
  type CastPhotoDisplayTarget,
  type CastPhotoTarget,
} from '@/src/api/cast-photo-queries';
import { useMembers } from '@/src/api/member-queries';
import { useTeamRoster } from '@/src/api/practice-queries';
import { uploadImageWithCompress } from '@/src/api/upload';
import {
  canRetryUpload,
  toUploadErrorMessage,
} from '@/src/hooks/upload-error-message';
import {
  castPhotoSlotKey,
  toCastPhotoBoard,
  type ActorPhotoRow,
  type CastPhotoFilter,
  type GroupPhotoTile,
  type PhotoUploadView,
  type TeamPhotoTile,
} from '@/src/sections/performance-cast/utils/cast-photo-rows';
import { moveId } from '@/src/sections/performance-cast/utils/cast-rows';
import type { RoleCardRatio } from '@/src/sections/performance-cast/utils/photo-crop';
import { toCropEditorRequest } from '@/src/sections/performance-cast/utils/photo-crop-editor';
import { MSG_D14 } from '@/src/shared/messages/d14';
import type { AdminRole } from '@/src/types/cast';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

const ACTOR_QUERY = { type: 'ACTOR', page: 1, size: 100 } as const;

interface SlotRecord extends PhotoUploadView {
  file: File;
  target: CastPhotoTarget;
}

interface DeleteRequest {
  target: CastPhotoDeleteTarget;
  message: string;
  description: string;
}

export type CastPhotoSectionStatus = 'loading' | 'error' | 'ready';

export function useCastPhotoSection(
  performanceId: string,
  roles: readonly AdminRole[],
  onError: (message: string) => void,
  onSuccess: (message: string) => void
) {
  const photosQuery = useCastPhotos(performanceId);
  const membersQuery = useMembers(ACTOR_QUERY);
  const rosterQuery = useTeamRoster(performanceId);
  const save = useSaveCastPhoto(performanceId);
  const remove = useDeleteCastPhoto(performanceId);
  const reorder = useReorderGroupPhotos(performanceId);
  const saveDisplay = useSaveCastPhotoDisplay(performanceId);
  const saveCardRatio = useSaveCastCardRatio(performanceId);
  const [editing, setEditing] = useState<{
    target: CastPhotoDisplayTarget;
    isNew: boolean;
  } | null>(null);
  const [slots, setSlots] = useState<Record<string, SlotRecord>>({});
  const [filter, setFilter] = useState<CastPhotoFilter>('all');
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(
    null
  );

  const patchSlot = (key: string, patch: Partial<SlotRecord>) =>
    setSlots((all) =>
      all[key] ? { ...all, [key]: { ...all[key], ...patch } } : all
    );
  const clearSlot = (key: string) =>
    setSlots((all) => {
      const { [key]: _removed, ...rest } = all;
      return rest;
    });

  const start = async (key: string, target: CastPhotoTarget, file: File) => {
    setSlots((all) => ({
      ...all,
      [key]: {
        file,
        target,
        phase: 'optimizing',
        progress: 0,
        errorMessage: null,
        canRetry: false,
      },
    }));
    let photo: {
      imageUrl: string;
      width: number | null;
      height: number | null;
    };
    try {
      const result = await uploadImageWithCompress('CAST_PHOTO', file, {
        onPrepared: () => patchSlot(key, { phase: 'uploading' }),
        onProgress: (progress) => patchSlot(key, { progress }),
      });
      photo = {
        imageUrl: result.url,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      const message = toUploadErrorMessage(error);
      patchSlot(key, {
        phase: 'error',
        errorMessage: canRetryUpload(message) ? MSG_D14.PHOTO_FAILED : message,
        canRetry: canRetryUpload(message),
      });
      return;
    }
    patchSlot(key, { phase: 'saving', progress: 100 });
    try {
      const opened = await save.mutateAsync({ target, photo });
      clearSlot(key);
      // 올린 직후 조정 창 자동 열기(designer §21.2 ①)
      if (opened) setEditing({ target: opened, isNew: true });
    } catch (error) {
      patchSlot(key, {
        phase: 'error',
        errorMessage: toApiErrorMessage(error),
        canRetry: true,
      });
    }
  };

  const status: CastPhotoSectionStatus = photosQuery.isPending
    ? 'loading'
    : photosQuery.isError
      ? 'error'
      : 'ready';

  const profileUrls = membersQuery.data
    ? Object.fromEntries(
        membersQuery.data.items.map((m) => [m.id, m.profileImageUrl])
      )
    : null;
  const teamMembers = rosterQuery.data
    ? Object.fromEntries(
        rosterQuery.data.teams.map((t) => [t.teamAccountId, t.memberIds])
      )
    : null;
  const board = photosQuery.data
    ? toCastPhotoBoard({
        roles,
        photos: photosQuery.data,
        profileUrls,
        teamMembers,
        uploads: slots,
        filter,
      })
    : null;

  const groupIds = photosQuery.data?.groupPhotos.map((p) => p.id) ?? [];
  const editorRequest =
    editing && photosQuery.data
      ? toCropEditorRequest(
          photosQuery.data,
          roles,
          editing.target,
          editing.isNew
        )
      : null;

  return {
    status,
    errorMessage: photosQuery.isError
      ? toApiErrorMessage(photosQuery.error)
      : null,
    onRetry: () => void photosQuery.refetch(),
    board,
    filter,
    onFilter: setFilter,
    isReordering: reorder.isPending,
    onAddGroup: (file: File) =>
      void start(castPhotoSlotKey.groupAdd, { kind: 'group-add' }, file),
    onReplaceGroup: (tile: GroupPhotoTile, file: File) =>
      void start(
        tile.slotKey,
        { kind: 'group-replace', photoId: tile.id },
        file
      ),
    onMoveGroup: (tile: GroupPhotoTile, direction: -1 | 1) => {
      const next = moveId(groupIds, tile.id, direction);
      if (next && !reorder.isPending)
        reorder.mutate(next, {
          onError: (error) => onError(toApiErrorMessage(error)),
        });
    },
    onDeleteGroup: (tile: GroupPhotoTile) =>
      setDeleteRequest({
        target: { kind: 'group', photoId: tile.id },
        message: MSG_D14.PHOTO_DELETE_GROUP(tile.position),
        description: MSG_D14.PHOTO_DELETE_GROUP_DESC,
      }),
    onUploadTeam: (tile: TeamPhotoTile, file: File) =>
      void start(
        tile.slotKey,
        { kind: 'team', teamAccountId: tile.teamAccountId },
        file
      ),
    onDeleteTeam: (tile: TeamPhotoTile) =>
      setDeleteRequest({
        target: { kind: 'team', teamAccountId: tile.teamAccountId },
        message: MSG_D14.PHOTO_DELETE_TEAM(tile.label),
        description: MSG_D14.PHOTO_DELETE_TEAM_DESC(tile.label),
      }),
    onUploadRole: (row: ActorPhotoRow, file: File) =>
      void start(
        row.slotKey,
        {
          kind: 'role',
          roleId: row.roleId,
          actorProfileId: row.actorProfileId,
        },
        file
      ),
    onDeleteRole: (row: ActorPhotoRow) =>
      setDeleteRequest({
        target: {
          kind: 'role',
          roleId: row.roleId,
          actorProfileId: row.actorProfileId,
        },
        message: MSG_D14.PHOTO_DELETE_ROLE,
        description: MSG_D14.PHOTO_DELETE_ROLE_DESC(
          row.roleLabel,
          row.name,
          profileUrls?.[row.memberId]
            ? MSG_D14.PHOTO_FALLBACK_PROFILE(row.name)
            : MSG_D14.PHOTO_FALLBACK_SILHOUETTE
        ),
      }),
    onRetryUpload: (slotKey: string) => {
      const slot = slots[slotKey];
      if (slot) void start(slotKey, slot.target, slot.file);
    },
    onDismissUpload: clearSlot,
    cardRatio: {
      value: board?.cardRatio ?? null,
      isSaving: saveCardRatio.isPending,
      onChange: (ratio: RoleCardRatio) => {
        if (saveCardRatio.isPending || ratio === board?.cardRatio) return;
        saveCardRatio.mutate(ratio, {
          onSuccess: () => onSuccess(MSG_D14.CARD_RATIO_SAVED),
          onError: (error) => onError(toApiErrorMessage(error)),
        });
      },
    },
    onAdjustRole: (row: ActorPhotoRow) =>
      setEditing({
        target: {
          kind: 'role',
          roleId: row.roleId,
          actorProfileId: row.actorProfileId,
        },
        isNew: false,
      }),
    onAdjustGroup: (tile: GroupPhotoTile) =>
      setEditing({ target: { kind: 'group', photoId: tile.id }, isNew: false }),
    onAdjustTeam: (tile: TeamPhotoTile) =>
      setEditing({
        target: { kind: 'team', teamAccountId: tile.teamAccountId },
        isNew: false,
      }),
    editor: {
      request: editorRequest,
      onSave: async (body: CastPhotoDisplaySave) => {
        await saveDisplay.mutateAsync(body);
        onSuccess(MSG_D14.CROP_SAVED);
      },
      onClose: () => setEditing(null),
    },
    deleteConfirm: {
      isOpen: deleteRequest !== null,
      message: deleteRequest?.message ?? '',
      description: deleteRequest?.description ?? '',
      isDeleting: remove.isPending,
      onConfirm: () => {
        if (!deleteRequest) return;
        remove.mutate(deleteRequest.target, {
          onSuccess: () => setDeleteRequest(null),
          onError: (error) => {
            setDeleteRequest(null);
            onError(toApiErrorMessage(error));
          },
        });
      },
      onCancel: () => setDeleteRequest(null),
    },
  };
}

export type CastPhotoSection = ReturnType<typeof useCastPhotoSection>;
