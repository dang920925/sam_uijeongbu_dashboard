'use client';

// ----------------------------------------------------------------------
// "등급 링크 + 단원 초대 링크" ViewModel(design §6.1b — 단원 선택 → `?tier=…&ref=…`). JSX 없음.
// - 단원 목록 = GET /admin/members/invite-codes(열 때만 부른다).
// - 코드가 없는 단원은 POST …/invite-code 로 발급한 뒤 합친다(코드가 있으면 발급하지 않음 — 재발급은 이전 링크 무효).
// - 복사는 호출 쪽(copy)이 하고, 성공하면 닫는다.
// ----------------------------------------------------------------------
import { useState } from 'react';

import { buildTierLink, type PriceTier } from '@/src/api/price-tier-mapper';
import {
  useInviteMembers,
  useIssueInviteCode,
} from '@/src/api/price-tier-queries';
import { MSG_D11 } from '@/src/shared/messages/d11';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export interface TierMemberOption {
  value: string;
  label: string;
}

export interface TierMemberLinkState {
  isOpen: boolean;
  tierName: string;
  options: TierMemberOption[];
  isLoading: boolean;
  selectedId: string | null;
  error: string | null;
  isSubmitting: boolean;
  onSelect: (memberId: string | null) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function useTierMemberLink(
  performanceId: string,
  clientPublicUrl: string | null,
  tiers: PriceTier[],
  copy: (text: string) => Promise<boolean>
) {
  const [tierId, setTierId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const membersQuery = useInviteMembers(tierId !== null);
  const issue = useIssueInviteCode();

  const tier = tiers.find((item) => item.id === tierId) ?? null;
  const members = membersQuery.data ?? [];

  const handleSubmit = async () => {
    const member = members.find((item) => item.memberId === selectedId);
    if (!tier || !member) {
      setError(MSG_D11.MEMBER_REQUIRED);
      return;
    }
    setError(null);
    setIsCopying(true);
    try {
      const code =
        member.inviteCode ?? (await issue.mutateAsync(member.memberId));
      const link = buildTierLink(
        clientPublicUrl,
        performanceId,
        tier.linkToken,
        code
      );
      if (link && (await copy(link))) setTierId(null);
    } catch (cause) {
      setError(toApiErrorMessage(cause));
    } finally {
      setIsCopying(false);
    }
  };

  const state: TierMemberLinkState = {
    isOpen: tier !== null,
    tierName: tier?.name ?? '',
    options: members.map((member) => ({
      value: member.memberId,
      label: member.name,
    })),
    isLoading: membersQuery.isPending,
    selectedId,
    error:
      error ??
      (membersQuery.isError ? toApiErrorMessage(membersQuery.error) : null),
    isSubmitting: isCopying,
    onSelect: (memberId) => {
      setSelectedId(memberId);
      setError(null);
    },
    onClose: () => {
      if (!isCopying) setTierId(null);
    },
    onSubmit: () => void handleSubmit(),
  };

  return {
    state,
    open: (id: string) => {
      setTierId(id);
      setSelectedId(null);
      setError(null);
    },
  };
}
