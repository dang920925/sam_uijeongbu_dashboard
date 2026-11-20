// ----------------------------------------------------------------------
// 수정 폼의 연결 공연 정리 — 선택지(관리 공연 목록)에 없는 공연 id 는 "선택 안 함"('')으로 둔다.
// 서버는 삭제된 공연이면 이미 null 을 주지만(develop qa1 Q3), 목록에 없는 id 를 그대로 다시 보내
// 404 PERF_001 이 나던 문제(qa1 QA1-013)를 화면에서도 막는다. 공연 목록을 아직 못 받았으면 건드리지 않는다.
// ----------------------------------------------------------------------
import type { ScheduleFormInput } from '@/src/api/schedule-mapper';

export function normalizeScheduleLink(
  form: ScheduleFormInput,
  performanceIds: ReadonlySet<string> | null
): ScheduleFormInput {
  if (!performanceIds || form.performanceId === '') return form;
  if (performanceIds.has(form.performanceId)) return form;
  return { ...form, performanceId: '', classId: '' };
}
