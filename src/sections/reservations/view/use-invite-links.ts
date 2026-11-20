'use client';

// ----------------------------------------------------------------------
// SCR-D12 초대 링크 탭 ViewModel(FN-35) — JSX 없음.
// 링크 = {CLIENT_PUBLIC_URL}/works/{performanceId}/book?ref={code}. 주소가 없으면 복사 비활성 + 이유 문구.
// 발급은 바로, 재발급은 확인창("이전 링크는 더 이상 쓸 수 없습니다. 재발급하시겠습니까?") 뒤.
// ----------------------------------------------------------------------
import { useMemo, useState } from 'react';

import { toInviteLink } from '@/src/api/invite-code-mapper';
import {
  useInviteCodes,
  useIssueInviteCode,
} from '@/src/api/invite-code-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { MSG_D12 } from '@/src/shared/messages/d12';
import { MEMBER_TYPE_LABEL } from '@/src/types/codes';
import { toApiErrorMessage } from '@/src/utils/api-error-message';
import { MEMBER_TYPE_TONE } from '@/src/utils/status-tone';

export interface InviteLinkRow {
  memberId: string;
  name: string;
  typeLabel: string;
  typeTone: (typeof MEMBER_TYPE_TONE)[keyof typeof MEMBER_TYPE_TONE];
  code: string | null;
  link: string | null;
}

export function useInviteLinks(
  clientPublicUrl: string | null,
  performanceId: string | null
) {
  const snackbar = useAppSnackbar();
  const query = useInviteCodes();
  const issue = useIssueInviteCode();
  const [reissueId, setReissueId] = useState<string | null>(null);

  const members = useMemo(() => query.data ?? [], [query.data]);
  const rows: InviteLinkRow[] = useMemo(
    () =>
      members.map((m) => ({
        memberId: m.memberId,
        name: m.name,
        typeLabel: MEMBER_TYPE_LABEL[m.type],
        typeTone: MEMBER_TYPE_TONE[m.type],
        code: m.inviteCode,
        link: toInviteLink(clientPublicUrl, performanceId, m.inviteCode),
      })),
    [members, clientPublicUrl, performanceId]
  );

  const runIssue = (memberId: string) =>
    issue.mutate(memberId, {
      onSuccess: () => {
        setReissueId(null);
        snackbar.success(MSG_D12.INV_ISSUED);
      },
      onError: (error) => {
        setReissueId(null);
        snackbar.error(toApiErrorMessage(error));
      },
    });

  const handleCopy = async (memberId: string) => {
    const link = rows.find((row) => row.memberId === memberId)?.link;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      snackbar.success(MSG_D12.INV_COPIED);
    } catch {
      snackbar.error(MSG_D12.INV_COPY_FAILED);
    }
  };

  return {
    rows,
    /** 수동 등록 초대 단원 선택지 */
    inviterOptions: members.map((m) => ({
      memberId: m.memberId,
      name: m.name,
    })),
    isLoading: query.isPending,
    isError: query.isError,
    errorMessage: query.isError ? toApiErrorMessage(query.error) : '',
    canCopy: clientPublicUrl !== null,
    issuingId: issue.isPending ? (issue.variables ?? null) : null,
    isReissueOpen: reissueId !== null,
    onRetry: () => void query.refetch(),
    onCopy: (memberId: string) => void handleCopy(memberId),
    onIssue: runIssue,
    onRequestReissue: setReissueId,
    onConfirmReissue: () => {
      if (reissueId) runIssue(reissueId);
    },
    onCancelReissue: () => setReissueId(null),
  };
}

export type InviteLinks = ReturnType<typeof useInviteLinks>;
