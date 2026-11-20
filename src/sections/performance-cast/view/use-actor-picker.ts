'use client';

// ----------------------------------------------------------------------
// SCR-D14 배우 고르기 ViewModel. JSX 없음. 세 갈래:
// - role: 배역에 배우 한 명 추가 → POST /members/{id}/cast-roles(roleId) — 배우 쪽 화면과 같은 경로(develop §17.5)
// - ensemble: "출연자 추가"(배역 없이) → 같은 경로, roleId 없음 → 서버가 "출연" 묶음을 쓰거나 만든다
// - cell: 회차 칸 캐스트(여러 명) → PUT /shows/{id}/roles/{id}/cast(배우 프로필 있는 배우만, 기본 캐스트 후보 먼저)
// 후보 = 배우 단원(GET /admin/members?type=ACTOR, size 100 — 극단 규모).
// ----------------------------------------------------------------------
import { useState } from 'react';

import { useAddMemberCast, useReplaceShowCast } from '@/src/api/cast-queries';
import { useMembers } from '@/src/api/member-queries';
import {
  type ActorCandidate,
  toActorCandidates,
} from '@/src/sections/performance-cast/utils/cast-rows';
import { MSG_D14 } from '@/src/shared/messages/d14';
import type { RoleCast } from '@/src/types/cast';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export type PickerTarget =
  | { mode: 'role'; roleId: string; roleLabel: string }
  | { mode: 'ensemble' }
  | {
      mode: 'cell';
      roleId: string;
      roleLabel: string;
      showId: string;
      showLabel: string;
      current: RoleCast[];
      defaultCast: RoleCast[];
    };

export interface ActorPickerState {
  isOpen: boolean;
  title: string;
  isMulti: boolean;
  query: string;
  candidates: ActorCandidate[];
  selected: string[];
  note: string;
  showNote: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onQuery: (query: string) => void;
  onToggle: (memberId: string) => void;
  onNote: (note: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const ACTOR_QUERY = { type: 'ACTOR', page: 1, size: 100 } as const;

function titleOf(target: PickerTarget | null): string {
  if (!target) return '';
  if (target.mode === 'role')
    return MSG_D14.PICKER_TITLE_ROLE(target.roleLabel);
  if (target.mode === 'ensemble') return MSG_D14.PICKER_TITLE_ENSEMBLE;
  return MSG_D14.PICKER_TITLE_CELL(target.roleLabel, target.showLabel);
}

export function useActorPicker(performanceId: string) {
  const [target, setTarget] = useState<PickerTarget | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const membersQuery = useMembers(ACTOR_QUERY);
  const addCast = useAddMemberCast();
  const replaceCell = useReplaceShowCast();

  const isCell = target?.mode === 'cell';
  const members = membersQuery.data?.items ?? [];
  const candidates = toActorCandidates(members, {
    query,
    defaultMemberIds: isCell ? target.defaultCast.map((a) => a.memberId) : [],
    requireProfile: isCell,
  });

  const open = (next: PickerTarget) => {
    setTarget(next);
    setQuery('');
    setNote('');
    setErrorMessage(null);
    setSelected(
      next.mode === 'cell' ? next.current.map((a) => a.memberId) : []
    );
  };
  const close = () => setTarget(null);

  const toggle = (memberId: string) =>
    setSelected((prev) =>
      isCell
        ? prev.includes(memberId)
          ? prev.filter((id) => id !== memberId)
          : [...prev, memberId]
        : [memberId]
    );

  const submit = () => {
    if (!target) return;
    if (selected.length === 0) {
      setErrorMessage(MSG_D14.PICKER_SELECT_REQUIRED);
      return;
    }
    const onError = (error: unknown) =>
      setErrorMessage(toApiErrorMessage(error));
    if (target.mode === 'cell') {
      const actors = selected.flatMap((memberId) => {
        const profileId = members.find(
          (m) => m.id === memberId
        )?.actorProfileId;
        const kept = target.current.find((a) => a.memberId === memberId);
        return profileId
          ? [{ actorProfileId: profileId, note: kept?.note ?? null }]
          : [];
      });
      replaceCell.mutate(
        { showId: target.showId, roleId: target.roleId, actors },
        { onSuccess: close, onError }
      );
      return;
    }
    const trimmed = note.trim();
    addCast.mutate(
      {
        memberId: selected[0],
        body: {
          performanceId,
          roleId: target.mode === 'role' ? target.roleId : null,
          note: trimmed === '' ? null : trimmed,
        },
      },
      { onSuccess: close, onError }
    );
  };

  const state: ActorPickerState = {
    isOpen: target !== null,
    title: titleOf(target),
    isMulti: isCell,
    query,
    candidates,
    selected,
    note,
    showNote: target !== null && !isCell,
    isLoading: membersQuery.isPending,
    isSubmitting: addCast.isPending || replaceCell.isPending,
    errorMessage,
    onQuery: setQuery,
    onToggle: toggle,
    onNote: setNote,
    onSubmit: submit,
    onClose: close,
  };

  return { state, open };
}
