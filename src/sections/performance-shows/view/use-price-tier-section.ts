'use client';

// ----------------------------------------------------------------------
// 가격 등급 카드 ViewModel(design §6.1b · develop §11.10). JSX 없음.
// - 순서 ▲▼: 바뀐 등급만 sortOrder PATCH(utils/tier-order) · 사용 스위치: 바로 PATCH isActive(진행 중엔 바뀔 값 표시).
// - 링크 복사(링크 전용만): navigator.clipboard → "복사되었습니다" / 실패 스낵바. 주소(CLIENT_PUBLIC_URL)가 없으면 비활성.
// - 링크 재발급: ConfirmDialog("이전 링크는 더 이상 쓸 수 없습니다. 재발급하시겠습니까?" + "{이름} 등급 링크").
// - 삭제: 쓰인 등급은 버튼 비활성(툴팁), 그래도 409 TIER_002 가 오면 닫고 스낵바(designer snackbar-tier002).
// ----------------------------------------------------------------------
import { useState } from 'react';

import {
  useDeletePriceTier,
  usePriceTiers,
  useReissuePriceTierLink,
  useReorderPriceTiers,
  useSavePriceTierActive,
} from '@/src/api/price-tier-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { moveTier } from '@/src/sections/performance-shows/utils/tier-order';
import { toTierRowDisplay } from '@/src/sections/performance-shows/utils/tier-row';
import { useTierDialog } from '@/src/sections/performance-shows/view/use-tier-dialog';
import { useTierMemberLink } from '@/src/sections/performance-shows/view/use-tier-member-link';
import { MSG_D11 } from '@/src/shared/messages/d11';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export function usePriceTierSection(
  performanceId: string,
  clientPublicUrl: string | null
) {
  const snackbar = useAppSnackbar();
  const tiersQuery = usePriceTiers(performanceId);
  const saveActive = useSavePriceTierActive();
  const reorder = useReorderPriceTiers();
  const deleteTier = useDeletePriceTier();
  const reissue = useReissuePriceTierLink();
  const dialog = useTierDialog(performanceId);
  const [reissueTargetId, setReissueTargetId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const tiers = tiersQuery.data ?? [];

  const copy = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      snackbar.success(MSG_D11.COPIED);
      return true;
    } catch {
      snackbar.error(MSG_D11.COPY_FAILED);
      return false;
    }
  };
  const memberLink = useTierMemberLink(
    performanceId,
    clientPublicUrl,
    tiers,
    copy
  );

  const pendingActive = saveActive.isPending ? saveActive.variables : undefined;
  const rows = tiers.map((tier, index) => {
    const row = toTierRowDisplay(
      tier,
      index,
      tiers.length,
      clientPublicUrl,
      performanceId
    );
    return pendingActive?.id === tier.id
      ? { ...row, isActive: pendingActive.isActive }
      : row;
  });
  const nameOf = (id: string | null) =>
    tiers.find((tier) => tier.id === id)?.name ?? '';
  const onError = (error: unknown) => snackbar.error(toApiErrorMessage(error));

  return {
    query: tiersQuery,
    hasActiveLinkOnlyTier: tiers.some(
      (tier) => tier.isActive && tier.visibility === 'LINK_ONLY'
    ),
    card: {
      rows,
      isBusy: saveActive.isPending || reorder.isPending,
      isLinkUnavailable: clientPublicUrl === null,
      onAdd: dialog.onOpenCreate,
      onEdit: (id: string) => {
        const target = tiers.find((tier) => tier.id === id);
        if (target) dialog.onOpenEdit(target);
      },
      onDelete: (id: string) => setDeleteTargetId(id),
      onReissue: (id: string) => setReissueTargetId(id),
      onToggleActive: (id: string, isActive: boolean) => {
        if (saveActive.isPending) return;
        saveActive.mutate({ id, isActive }, { onError });
      },
      onMove: (id: string, direction: 'up' | 'down') => {
        const changes = moveTier(tiers, id, direction);
        if (changes.length === 0 || reorder.isPending) return;
        reorder.mutate(changes, { onError });
      },
      onCopyLink: (id: string) => {
        const link = rows.find((row) => row.id === id)?.link;
        if (link) void copy(link);
      },
      onCopyWithMember: memberLink.open,
    },
    dialog,
    memberLink: memberLink.state,
    reissueConfirm: {
      isOpen: reissueTargetId !== null,
      description: MSG_D11.REISSUE_TARGET(nameOf(reissueTargetId)),
      isLoading: reissue.isPending,
      onConfirm: () => {
        if (!reissueTargetId) return;
        reissue.mutate(reissueTargetId, {
          onSettled: () => setReissueTargetId(null),
          onError,
        });
      },
      onCancel: () => setReissueTargetId(null),
    },
    deleteConfirm: {
      isOpen: deleteTargetId !== null,
      description: nameOf(deleteTargetId),
      isLoading: deleteTier.isPending,
      onConfirm: () => {
        if (!deleteTargetId) return;
        deleteTier.mutate(deleteTargetId, {
          onSettled: () => setDeleteTargetId(null),
          onError,
        });
      },
      onCancel: () => setDeleteTargetId(null),
    },
  };
}

export type PriceTierSection = ReturnType<typeof usePriceTierSection>;
