'use client';

// ----------------------------------------------------------------------
// SCR-D14 배역 추가·수정 다이얼로그 ViewModel. JSX 없음.
// "출연(배역 없음) 묶음"을 고르면 이름 없이 만든다 — 이미 있으면 그 선택지를 막는다(서버도 409 ROL_004).
// ----------------------------------------------------------------------
import { useState } from 'react';

import { toRoleRequest } from '@/src/api/cast-mapper';
import { useCreateRole, usePatchRole } from '@/src/api/cast-queries';
import { validateRoleForm } from '@/src/sections/performance-cast/utils/role-form';
import type { AdminRole, RoleFormInput } from '@/src/types/cast';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export interface RoleDialogState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValue: RoleFormInput;
  canChooseEnsemble: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (input: RoleFormInput) => void;
  onClose: () => void;
}

const EMPTY: RoleFormInput = { isEnsemble: false, name: '', description: '' };

export function useRoleDialog(performanceId: string, roles: AdminRole[]) {
  const [target, setTarget] = useState<
    { mode: 'create' } | { mode: 'edit'; role: AdminRole } | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const create = useCreateRole(performanceId);
  const patch = usePatchRole();
  const hasEnsemble = roles.some((role) => role.name === null);

  const close = () => {
    setTarget(null);
    setErrorMessage(null);
  };

  const submit = (input: RoleFormInput) => {
    const invalid = validateRoleForm(input);
    if (invalid) {
      setErrorMessage(invalid);
      return;
    }
    const body = toRoleRequest(input);
    const onError = (error: unknown) =>
      setErrorMessage(toApiErrorMessage(error));
    if (target?.mode === 'edit') {
      patch.mutate({ id: target.role.id, body }, { onSuccess: close, onError });
    } else {
      create.mutate(body, { onSuccess: close, onError });
    }
  };

  const state: RoleDialogState = {
    isOpen: target !== null,
    mode: target?.mode ?? 'create',
    initialValue:
      target?.mode === 'edit'
        ? {
            isEnsemble: target.role.name === null,
            name: target.role.name ?? '',
            description: target.role.description ?? '',
          }
        : EMPTY,
    canChooseEnsemble:
      !hasEnsemble || (target?.mode === 'edit' && target.role.name === null),
    isSubmitting: create.isPending || patch.isPending,
    errorMessage,
    onSubmit: submit,
    onClose: close,
  };

  return {
    state,
    onOpenCreate: () => setTarget({ mode: 'create' }),
    onOpenEdit: (role: AdminRole) => setTarget({ mode: 'edit', role }),
  };
}
