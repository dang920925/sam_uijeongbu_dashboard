// ----------------------------------------------------------------------
// 신청서 매퍼(FN-13). 응답의 생략 키는 null 로 맞추고(계약 J-03), 등록 폼은 이름 trim·빈 연락처 null.
// ----------------------------------------------------------------------
import type {
  Application,
  ApplicationContactRequest,
  ApplicationItemResponse,
  RegisterMemberFromApplicationRequest,
} from '@/src/types/application';
import type { MemberFormInput } from '@/src/types/member';

export function fromApplicationItemResponse(
  res: ApplicationItemResponse
): Application {
  return {
    id: res.id,
    appType: res.appType,
    applicantName: res.applicantName,
    phone: res.phone,
    performance: res.performance
      ? { id: res.performance.id, title: res.performance.title }
      : null,
    preferredDate: res.preferredDate ?? null,
    preferredTime: res.preferredTime ?? null,
    motivation: res.motivation ?? null,
    consultationMethod: res.consultationMethod ?? null,
    question: res.question ?? null,
    age: res.age ?? null,
    gender: res.gender ?? null,
    status: res.status,
    processedAt: res.processedAt ?? null,
    createdAt: res.createdAt,
    member: res.member ? { id: res.member.id, name: res.member.name } : null,
    // U31·U29 — 옛 응답(필드 없음)은 빈 값으로(배포 순서가 어긋나도 화면이 깨지지 않게)
    interestedPerformances: (res.interestedPerformances ?? []).map((p) => ({
      id: p.id,
      title: p.title,
    })),
    interestUndecided: res.interestUndecided ?? null,
    contactedAt: res.contactedAt ?? null,
    contactNote: res.contactNote ?? null,
    progress: res.progress ?? 'RECEIVED',
    progressUpdatedAt: res.progressUpdatedAt ?? null,
    scheduleCancellation: res.scheduleCancellation
      ? {
          scheduleId: res.scheduleCancellation.scheduleId,
          reason: res.scheduleCancellation.reason,
        }
      : null,
  };
}

/** 연락 토글·메모 저장 요청(U31 보강). note 를 넘기지 않으면 메모는 그대로, 빈 값이면 지움(null) */
export function toApplicationContactRequest(
  contacted: boolean,
  note?: string
): ApplicationContactRequest {
  if (note === undefined) return { contacted };
  const trimmed = note.trim();
  return { contacted, note: trimmed === '' ? null : trimmed };
}

export function toRegisterMemberFromApplicationRequest(
  input: MemberFormInput
): RegisterMemberFromApplicationRequest {
  const phone = input.phone.trim();
  return {
    name: input.name.trim(),
    phone: phone === '' ? null : phone,
    type: input.type,
  };
}
