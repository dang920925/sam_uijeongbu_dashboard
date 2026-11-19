// ----------------------------------------------------------------------
// 반 폼 검증(FN-10) — 서버와 같은 문구로 미리 막는다.
// 반 이름 1~100(develop ClassUpsert "반 이름을 입력해주세요.") · 종료 > 시작(CLS_003 문구).
// ----------------------------------------------------------------------
import { MSG_D04 } from '@/src/shared/messages/d04';
import type { ClassFormInput } from '@/src/types/performance-class';

export interface ClassFormErrors {
  name: string | null;
  time: string | null;
}

export const NO_CLASS_FORM_ERRORS: ClassFormErrors = { name: null, time: null };

export function validateClassForm(form: ClassFormInput): ClassFormErrors {
  const hasBothTimes = form.startTime !== '' && form.endTime !== '';
  return {
    name: form.name.trim() === '' ? MSG_D04.CLASS_NAME_REQUIRED : null,
    time:
      hasBothTimes && form.endTime <= form.startTime
        ? MSG_D04.CLASS_TIME_ORDER
        : null,
  };
}

export function hasClassFormError(errors: ClassFormErrors): boolean {
  return errors.name !== null || errors.time !== null;
}
