'use client';

// ----------------------------------------------------------------------
// SCR-D14 배역·캐스팅 ViewModel(R3 U26 · U33 — design §6 SCR-D14 · §12, develop §11.7 · §17). JSX 없음.
// - 공연(제목·404·공개 스위치) → 'not-found' | 'error' 는 D04 상태 카드, 그 밖은 머리+탭 + 본문(bodyStatus).
// - 공개 스위치: PATCH castPublic(진행 중에는 바뀔 값을 미리 보인다). 실패는 스낵바.
// - 배역: ▲▼ 순서(PUT order) · 모집 중 스위치 · 배우 빼기(DELETE /members/{id}/cast-roles/{roleId} — 회차 지정이
//   남으면 안내 스낵바) · 수정·삭제. 배우 추가·출연자 추가·회차 칸은 배우 고르기(useActorPicker).
// - 참여자: useCreditSection. 공개 안 됨 이유는 utils/cast-reasons.
// - (U45) 팀 구성: useTeamRosterSection(배우 × 팀 체크 — 자기 조회 상태를 카드 안에서 보인다).
// - (U48) 캐스트 사진: useCastPhotoSection(단체샷·팀샷·배역 사진) + 홈페이지 미리보기(useHomepagePreview).
//   '홈페이지에서 보기' = {CLIENT_PUBLIC_URL}/works/{id}#cast(공개 켜짐일 때만 보인다).
// ----------------------------------------------------------------------
import { useState } from 'react';

import {
  useCredits,
  useDeleteRole,
  usePatchRole,
  useRemoveMemberCast,
  useReorderRoles,
  useRoles,
  useSaveCastPublic,
  useShowCastGrid,
  useClearShowCast,
} from '@/src/api/cast-queries';
import { usePerformance } from '@/src/api/performance-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { useErrorSnackbar } from '@/src/hooks/use-error-snackbar';
import { toCastGrid } from '@/src/sections/performance-cast/utils/cast-grid';
import {
  moveId,
  toRoleRows,
} from '@/src/sections/performance-cast/utils/cast-rows';
import { useActorPicker } from '@/src/sections/performance-cast/view/use-actor-picker';
import { useCreditSection } from '@/src/sections/performance-cast/view/use-credit-section';
import { useRoleDialog } from '@/src/sections/performance-cast/view/use-role-dialog';
import { useCastPhotoSection } from '@/src/sections/performance-cast/view/use-cast-photo-section';
import { useHomepagePreview } from '@/src/sections/performance-detail/view/use-homepage-preview';
import { useTeamRosterSection } from '@/src/sections/performance-cast/view/use-team-roster-section';
import { MSG_D14 } from '@/src/shared/messages/d14';
import {
  isNotFoundError,
  toApiErrorMessage,
} from '@/src/utils/api-error-message';

export type PerformanceCastStatus = 'not-found' | 'error' | 'ready';
export type PerformanceCastBodyStatus = 'loading' | 'error' | 'ready';

export function usePerformanceCastViewModel(
  performanceId: string,
  clientPublicUrl: string | null
) {
  const snackbar = useAppSnackbar();
  const performanceQuery = usePerformance(performanceId);
  const rolesQuery = useRoles(performanceId);
  const gridQuery = useShowCastGrid(performanceId);
  const creditsQuery = useCredits(performanceId);
  const savePublic = useSaveCastPublic(performanceId);
  const patchRole = usePatchRole();
  const deleteRole = useDeleteRole();
  const reorderRoles = useReorderRoles(performanceId);
  const removeCast = useRemoveMemberCast();
  const clearCell = useClearShowCast();
  const picker = useActorPicker(performanceId);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  const roles = rolesQuery.data ?? [];
  const performance = performanceQuery.data;
  const castPublic =
    (savePublic.isPending ? savePublic.variables : performance?.castPublic) ??
    false;
  const ctx = {
    castPublic: performance?.castPublic ?? false,
    performanceVisible: performance?.isVisible ?? false,
  };
  const roleDialog = useRoleDialog(performanceId, roles);
  const creditSection = useCreditSection(
    performanceId,
    creditsQuery.data ?? [],
    ctx,
    snackbar
  );
  const onFail = (error: unknown) => snackbar.error(toApiErrorMessage(error));
  const teamSection = useTeamRosterSection(performanceId, snackbar.error);
  const photoSection = useCastPhotoSection(
    performanceId,
    roles,
    snackbar.error,
    snackbar.success
  );
  const preview = useHomepagePreview(performanceId, clientPublicUrl);

  const status: PerformanceCastStatus = performanceQuery.isError
    ? isNotFoundError(performanceQuery.error)
      ? 'not-found'
      : 'error'
    : 'ready';
  const bodyQueries = [rolesQuery, gridQuery, creditsQuery];
  const failed = bodyQueries.find((q) => q.isError);
  const bodyStatus: PerformanceCastBodyStatus =
    performanceQuery.isPending || bodyQueries.some((q) => q.isPending)
      ? 'loading'
      : failed
        ? 'error'
        : 'ready';
  const performanceError = performanceQuery.isError
    ? toApiErrorMessage(performanceQuery.error)
    : null;
  const bodyError = failed ? toApiErrorMessage(failed.error) : null;
  useErrorSnackbar(status === 'error' ? performanceError : null);
  useErrorSnackbar(status === 'ready' ? bodyError : null);

  const roleRows = toRoleRows(roles, ctx);
  const grid = gridQuery.data
    ? toCastGrid(gridQuery.data, ctx)
    : { shows: [], rows: [] };
  const deleteRoleTarget = roleRows.find((r) => r.id === deleteRoleId) ?? null;

  return {
    status,
    errorMessage: performanceError,
    onRetry: () => void performanceQuery.refetch(),
    title: performance?.title ?? null,
    bodyStatus,
    bodyErrorMessage: bodyError,
    onBodyRetry: () => {
      for (const q of bodyQueries) if (q.isError) void q.refetch();
    },
    publicSwitch: {
      checked: castPublic,
      isSaving: savePublic.isPending,
      onChange: (next: boolean) => savePublic.mutate(next, { onError: onFail }),
    },
    roleSection: {
      rows: roleRows,
      onAdd: roleDialog.onOpenCreate,
      onAddPerformer: () => picker.open({ mode: 'ensemble' }),
      onAddActor: (roleId: string) => {
        const row = roleRows.find((r) => r.id === roleId);
        if (row) picker.open({ mode: 'role', roleId, roleLabel: row.label });
      },
      onRemoveActor: (roleId: string, memberId: string) =>
        removeCast.mutate(
          { memberId, roleId },
          {
            onSuccess: (result) => {
              if (result.showOverrideCount > 0)
                snackbar.success(
                  MSG_D14.overrideLeft(result.showOverrideCount)
                );
            },
            onError: onFail,
          }
        ),
      onToggleRecruiting: (roleId: string, isRecruiting: boolean) =>
        patchRole.mutate(
          { id: roleId, body: { isRecruiting } },
          { onError: onFail }
        ),
      onMove: (roleId: string, direction: -1 | 1) => {
        const next = moveId(
          roles.map((r) => r.id),
          roleId,
          direction
        );
        if (next) reorderRoles.mutate(next, { onError: onFail });
      },
      onEdit: (roleId: string) => {
        const role = roles.find((r) => r.id === roleId);
        if (role) roleDialog.onOpenEdit(role);
      },
      onDelete: (roleId: string) => setDeleteRoleId(roleId),
    },
    roleDialog: roleDialog.state,
    roleDeleteConfirm: {
      isOpen: deleteRoleTarget !== null,
      label: deleteRoleTarget?.label ?? '',
      isDeleting: deleteRole.isPending,
      onConfirm: () => {
        if (!deleteRoleId) return;
        deleteRole.mutate(deleteRoleId, {
          onSuccess: () => setDeleteRoleId(null),
          onError: (error) => {
            setDeleteRoleId(null);
            onFail(error);
          },
        });
      },
      onCancel: () => setDeleteRoleId(null),
    },
    grid: {
      ...grid,
      hasShows: grid.shows.length > 0,
      hasRoles: roles.length > 0,
      onEditCell: (showId: string, roleId: string) => {
        const row = grid.rows.find((r) => r.roleId === roleId);
        const cell = row?.cells.find((c) => c.showId === showId);
        const role = roles.find((r) => r.id === roleId);
        if (!row || !cell || !role) return;
        picker.open({
          mode: 'cell',
          roleId,
          roleLabel: row.roleLabel,
          showId,
          showLabel: cell.showLabel,
          current: cell.actors,
          defaultCast: role.defaultCast,
        });
      },
      onClearCell: (showId: string, roleId: string) =>
        clearCell.mutate({ showId, roleId }, { onError: onFail }),
    },
    picker: picker.state,
    creditSection,
    teamSection,
    photoSection,
    preview,
    homepageCastUrl: clientPublicUrl
      ? `${clientPublicUrl}/works/${encodeURIComponent(performanceId)}#cast`
      : null,
  };
}

export type PerformanceCastViewModel = ReturnType<
  typeof usePerformanceCastViewModel
>;
