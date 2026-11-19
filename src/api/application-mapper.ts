// ----------------------------------------------------------------------
// 신청서 매퍼(FN-13). 응답의 생략 키는 null 로 맞추고(계약 J-03), 등록 폼은 이름 trim·빈 연락처 null.
// ----------------------------------------------------------------------
import type {
  Application,
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
  };
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
