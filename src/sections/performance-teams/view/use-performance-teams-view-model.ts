'use client';

// ----------------------------------------------------------------------
// U34 '팀 계정' 탭 ViewModel(develop §18.2 · PR-1·6·8). JSX 없음.
// - 공연(제목·404)은 D04 상태 카드, 팀 목록은 본문 로딩·오류(TEAM_004 기능 꺼짐 포함 — 서버 문구)·내용.
// - 비밀번호는 기본 가림, 줄마다 보기/복사, "전체 복사" = 사용 중 계정만 라벨 순, 팀마다 한 줄 "A - 아이디: …, 비밀번호: …"(PR-8 — 사용자 승인 형식).
// - 재발급은 확인 대화상자(세션 무효 안내) 뒤. 사용 스위치·접두어 저장은 바로 반영, 실패는 스낵바.
// ----------------------------------------------------------------------
import { useState } from 'react';

import { usePerformance } from '@/src/api/performance-queries';
import { toTeamCopyAll, toTeamCopyLine } from '@/src/api/practice-mapper';
import {
  useCreateTeamAccount,
  useResetTeamPassword,
  useSetTeamAccountActive,
  useTeamAccounts,
  useUpdateTeamPrefix,
} from '@/src/api/practice-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  isValidTeamPrefix,
  toTeamRows,
} from '@/src/sections/performance-teams/utils/team-row';
import { MSG_TEAMS } from '@/src/shared/messages/team-accounts';
import {
  isNotFoundError,
  toApiErrorMessage,
} from '@/src/utils/api-error-message';

export type PerformanceTeamsStatus = 'not-found' | 'error' | 'ready';
export type PerformanceTeamsBodyStatus = 'loading' | 'error' | 'ready';

export function usePerformanceTeamsViewModel(performanceId: string) {
  const snackbar = useAppSnackbar();
  const performanceQuery = usePerformance(performanceId);
  const teamsQuery = useTeamAccounts(performanceId);
  const create = useCreateTeamAccount(performanceId);
  const savePrefix = useUpdateTeamPrefix(performanceId);
  const reset = useResetTeamPassword();
  const setActive = useSetTeamAccountActive();
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());
  const [prefixDraft, setPrefixDraft] = useState<string | null>(null);
  const [reissueId, setReissueId] = useState<string | null>(null);

  const teams = teamsQuery.data?.items ?? [];
  const prefix = teamsQuery.data?.prefix ?? null;
  const prefixValue = prefixDraft ?? prefix ?? '';
  const prefixError =
    prefixDraft !== null && !isValidTeamPrefix(prefixDraft)
      ? MSG_TEAMS.PREFIX_INVALID
      : null;
  const reissueTarget = teams.find((t) => t.id === reissueId) ?? null;

  const copy = async (text: string) => {
    if (!text) return snackbar.error(MSG_TEAMS.COPY_ALL_EMPTY);
    try {
      await navigator.clipboard.writeText(text);
      snackbar.success(MSG_TEAMS.COPIED);
    } catch {
      snackbar.error(MSG_TEAMS.COPY_FAILED);
    }
  };
  const fail = (error: unknown) => snackbar.error(toApiErrorMessage(error));

  const status: PerformanceTeamsStatus = performanceQuery.isError
    ? isNotFoundError(performanceQuery.error)
      ? 'not-found'
      : 'error'
    : 'ready';

  return {
    status,
    errorMessage: performanceQuery.isError
      ? toApiErrorMessage(performanceQuery.error)
      : null,
    onRetry: () => void performanceQuery.refetch(),
    title: performanceQuery.data?.title ?? null,
    bodyStatus: (teamsQuery.isPending
      ? 'loading'
      : teamsQuery.isError
        ? 'error'
        : 'ready') as PerformanceTeamsBodyStatus,
    bodyErrorMessage: teamsQuery.isError
      ? toApiErrorMessage(teamsQuery.error)
      : null,
    onBodyRetry: () => void teamsQuery.refetch(),
    card: {
      hasPrefix: prefix !== null,
      rows: toTeamRows(teams, revealed),
      isBusy: create.isPending || setActive.isPending || reset.isPending,
      prefixValue,
      prefixError,
      isPrefixDirty: prefixDraft !== null && prefixDraft !== prefix,
      isPrefixSaving: savePrefix.isPending,
      onPrefixChange: (value: string) => setPrefixDraft(value),
      onPrefixSave: () => {
        if (prefixDraft === null || prefixError) return;
        savePrefix.mutate(prefixDraft, {
          onSuccess: () => {
            setPrefixDraft(null);
            snackbar.success(MSG_TEAMS.PREFIX_SAVED);
          },
          onError: fail,
        });
      },
      onAdd: () =>
        create.mutate(undefined, {
          onSuccess: (team) => {
            setRevealed((s) => new Set(s).add(team.id));
            snackbar.success(MSG_TEAMS.CREATED(team.username));
          },
          onError: fail,
        }),
      onCopyAll: () => void copy(toTeamCopyAll(teams)),
      onCopyRow: (id: string) => {
        const team = teams.find((t) => t.id === id);
        if (team?.password) void copy(toTeamCopyLine(team));
      },
      onToggleReveal: (id: string) =>
        setRevealed((s) => {
          const next = new Set(s);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      onToggleActive: (id: string, isActive: boolean) =>
        setActive.mutate({ id, isActive }, { onError: fail }),
      onReissue: (id: string) => setReissueId(id),
    },
    reissueConfirm: {
      isOpen: reissueTarget !== null,
      description: reissueTarget
        ? MSG_TEAMS.REISSUE_DESC(reissueTarget.username)
        : null,
      isLoading: reset.isPending,
      onConfirm: () => {
        if (!reissueId) return;
        reset.mutate(reissueId, {
          onSuccess: (team) => {
            setRevealed((s) => new Set(s).add(team.id));
            snackbar.success(MSG_TEAMS.REISSUED);
          },
          onError: fail,
          onSettled: () => setReissueId(null),
        });
      },
      onCancel: () => setReissueId(null),
    },
  };
}

export type PerformanceTeamsViewModel = ReturnType<
  typeof usePerformanceTeamsViewModel
>;
