'use client';

// ----------------------------------------------------------------------
// U29 일정 취소·해제 상태(design §8 SCR-D08) — JSX 없음.
// - 취소 창: 사유*(trim 1~50) · 참관 체크(연습·공연만, 기본 켬) · 참관 신청 경고(cancel-impact, 창 열 때만 조회).
// - 409(SCH_003 이미 취소 · SCH_004 취소 아님)는 창을 닫고 오류 스낵바 — 훅이 일정을 다시 받는다.
//   그 밖의 실패는 창 안 문구(입력 보존). 성공은 스낵바 "저장되었습니다".
// - 해제는 확인창 "취소를 해제하시겠습니까?".
// ----------------------------------------------------------------------
import { useMemo, useState } from 'react';

import {
  useCancelSchedule,
  useRestoreSchedule,
  useScheduleCancelImpact,
} from '@/src/api/schedule-queries';
import type { AppSnackbar } from '@/src/hooks/use-app-snackbar';
import { ApiError } from '@/src/lib/api-client';
import {
  canCloseObservation,
  cancelReasonCount,
  CANCEL_REASON_MAX,
  summarizeCancelImpact,
  validateCancelReason,
} from '@/src/sections/schedules/utils/schedule-cancel';
import { toScheduleDetail } from '@/src/sections/schedules/utils/schedule-detail';
import { MSG_COMMON } from '@/src/shared/messages/common';
import type { Schedule } from '@/src/types/content';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

const EMPTY_NAMES = { performances: new Map(), classes: new Map() };

const isConflict = (error: unknown) =>
  error instanceof ApiError && error.status === 409;

export function useScheduleCancel(snackbar: AppSnackbar) {
  const [target, setTarget] = useState<Schedule | null>(null);
  const [reason, setReason] = useState('');
  const [observationClosed, setObservationClosed] = useState(true);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Schedule | null>(null);
  const impactQuery = useScheduleCancelImpact(target?.id ?? null);
  const cancel = useCancelSchedule();
  const restore = useRestoreSchedule();

  const summary = useMemo(() => {
    if (!target) return null;
    const detail = toScheduleDetail(target, EMPTY_NAMES);
    return detail
      ? {
          typeLabel: detail.typeLabel,
          typeTone: detail.typeTone,
          typeVariant: detail.typeVariant,
          title: detail.title,
          whenText: detail.whenText,
        }
      : null;
  }, [target]);

  const openCancel = (schedule: Schedule) => {
    setTarget(schedule);
    setReason('');
    setObservationClosed(true);
    setReasonError(null);
    setSubmitError(null);
  };

  const handleSubmit = () => {
    if (!target) return;
    const error = validateCancelReason(reason);
    setReasonError(error);
    if (error) return;
    setSubmitError(null);
    cancel.mutate(
      { schedule: target, input: { reason, observationClosed } },
      {
        onSuccess: () => {
          setTarget(null);
          snackbar.success(MSG_COMMON.SAVED);
        },
        onError: (err) => {
          if (isConflict(err)) {
            setTarget(null);
            snackbar.error(toApiErrorMessage(err));
          } else setSubmitError(toApiErrorMessage(err));
        },
      }
    );
  };

  const handleConfirmRestore = () => {
    if (!restoreTarget) return;
    restore.mutate(restoreTarget.id, {
      onSuccess: () => {
        setRestoreTarget(null);
        snackbar.success(MSG_COMMON.SAVED);
      },
      onError: (err) => {
        setRestoreTarget(null);
        snackbar.error(toApiErrorMessage(err));
      },
    });
  };

  return {
    isOpen: target !== null,
    summary,
    reason,
    reasonMax: CANCEL_REASON_MAX,
    reasonCount: cancelReasonCount(reason),
    reasonError,
    submitError,
    showObservation: target ? canCloseObservation(target.type) : false,
    observationClosed,
    impact: summarizeCancelImpact(impactQuery.data),
    isSubmitting: cancel.isPending,
    isRestoreOpen: restoreTarget !== null,
    isRestoring: restore.isPending,
    openCancel,
    openRestore: setRestoreTarget,
    onReasonChange: (value: string) => {
      setReason(value);
      if (reasonError) setReasonError(null);
    },
    onObservationChange: setObservationClosed,
    onSubmit: handleSubmit,
    onClose: () => setTarget(null),
    onConfirmRestore: handleConfirmRestore,
    onCancelRestore: () => setRestoreTarget(null),
  };
}

export type ScheduleCancelState = ReturnType<typeof useScheduleCancel>;
