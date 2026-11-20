'use client';

// ----------------------------------------------------------------------
// 반 추가·수정 다이얼로그 ViewModel(FN-10). JSX 없음.
// - 폼 상태·검증·요일 토글 상태·충돌 경고를 계산해 다이얼로그 View 에 넘긴다.
// - 충돌 사전 계산은 useAllClasses('ACTIVE')(전 공연) + utils/class-conflict 순수 함수. 수정 중인 자기 반 제외.
// - 충돌이면 제출 버튼을 막는다(현행 disabled={conflicting}). 서버 409 CLS_002 도 같은 문구로 다이얼로그 안에 보인다.
// - 요일·시간을 바꾸면 제출 실패 문구를 지운다(현행 setConflictError('')).
// ----------------------------------------------------------------------
import { useState } from 'react';

import { toClassFormInput } from '@/src/api/performance-mapper';
import {
  useAllClasses,
  useCreateClass,
  useSaveClass,
} from '@/src/api/performance-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { MSG_D04 } from '@/src/shared/messages/d04';
import { toApiErrorMessage } from '@/src/utils/api-error-message';
import {
  getDayToggleStates,
  hasClassConflict,
  toggleDay,
  type DayToggleState,
} from '@/src/sections/performance-detail/utils/class-conflict';
import {
  hasClassFormError,
  NO_CLASS_FORM_ERRORS,
  validateClassForm,
  type ClassFormErrors,
} from '@/src/sections/performance-detail/utils/validate-class-form';
import { MSG_COMMON } from '@/src/shared/messages/common';
import type { ClassStatus, DayCode } from '@/src/types/codes';
import type {
  ClassFormInput,
  PerformanceClass,
} from '@/src/types/performance-class';
import { todayKst } from '@/src/utils/kst-date-format';

const EMPTY_FORM: ClassFormInput = {
  name: '',
  daysOfWeek: [],
  startTime: '',
  endTime: '',
  deadline: '',
  location: '',
  status: 'ACTIVE',
};

type TextField = 'name' | 'startTime' | 'endTime' | 'deadline' | 'location';
/** 이 칸이 바뀌면 충돌 결과가 달라질 수 있어 제출 실패 문구를 지운다 */
const SLOT_FIELDS: TextField[] = ['startTime', 'endTime'];

export interface ClassDialogState {
  isOpen: boolean;
  isEdit: boolean;
  form: ClassFormInput;
  errors: ClassFormErrors;
  dayStates: DayToggleState[];
  isConflicting: boolean;
  /** 서버 실패 문구(다이얼로그 오류 상자) */
  submitError: string | null;
  /** 화면이 감지한 충돌의 제출 차단 문구(SCR-D04 — qa1 QA1-014, 모양은 qa2 QA2-008 빨간 글자 한 줄) */
  blockMessage: string | null;
  isSubmitting: boolean;
  onOpenCreate: () => void;
  onOpenEdit: (item: PerformanceClass) => void;
  onClose: () => void;
  onFieldChange: (field: TextField, value: string) => void;
  onStatusChange: (status: ClassStatus) => void;
  onToggleDay: (day: DayCode) => void;
  onSubmit: () => void;
}

export function usePerformanceClassDialog(
  performanceId: string
): ClassDialogState {
  const snackbar = useAppSnackbar();
  const allClassesQuery = useAllClasses('ACTIVE');
  const createClass = useCreateClass(performanceId);
  const saveClass = useSaveClass();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClassFormInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<ClassFormErrors>(NO_CLASS_FORM_ERRORS);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const conflictOptions = { today: todayKst(), excludeId: editingId };
  const allClasses = allClassesQuery.data ?? [];
  const isConflicting = hasClassConflict(form, allClasses, conflictOptions);
  const dayStates = getDayToggleStates(form, allClasses, conflictOptions);
  const isSubmitting = createClass.isPending || saveClass.isPending;

  const open = (id: string | null, initial: ClassFormInput) => {
    setEditingId(id);
    setForm(initial);
    setErrors(NO_CLASS_FORM_ERRORS);
    setSubmitError(null);
    setIsOpen(true);
  };

  const handleSubmit = () => {
    const nextErrors = validateClassForm(form);
    setErrors(nextErrors);
    if (hasClassFormError(nextErrors) || isConflicting || isSubmitting) return;
    setSubmitError(null);
    const onSuccess = () => {
      setIsOpen(false);
      if (editingId) snackbar.success(MSG_COMMON.SAVED);
    };
    const onError = (error: unknown) =>
      setSubmitError(toApiErrorMessage(error));
    if (editingId) {
      saveClass.mutate({ id: editingId, input: form }, { onSuccess, onError });
    } else {
      createClass.mutate(form, { onSuccess, onError });
    }
  };

  return {
    isOpen,
    isEdit: editingId !== null,
    form,
    errors,
    dayStates,
    isConflicting,
    submitError,
    blockMessage: isConflicting ? MSG_D04.CLASS_CONFLICT_BLOCKED : null,
    isSubmitting,
    onOpenCreate: () => open(null, EMPTY_FORM),
    onOpenEdit: (item) => open(item.id, toClassFormInput(item)),
    onClose: () => {
      if (!isSubmitting) setIsOpen(false);
    },
    onFieldChange: (field, value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (SLOT_FIELDS.includes(field)) setSubmitError(null);
    },
    onStatusChange: (status) => {
      setForm((prev) => ({ ...prev, status }));
      setSubmitError(null);
    },
    onToggleDay: (day) => {
      setForm((prev) => ({
        ...prev,
        daysOfWeek: toggleDay(prev.daysOfWeek, day),
      }));
      setSubmitError(null);
    },
    onSubmit: handleSubmit,
  };
}
