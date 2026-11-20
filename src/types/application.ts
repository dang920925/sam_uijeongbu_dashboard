// 신청서(FN-13, D6 승인과 등록 분리) — develop §3.4 "신청서".
import type {
  ApplicationStatus,
  ApplicationType,
  ConsultationMethod,
  Gender,
  MemberType,
  PreferredTime,
} from '@/src/types/codes';
import type { MemberListItemResponse } from '@/src/types/member';

export interface ApplicationItemResponse {
  id: string;
  appType: ApplicationType;
  applicantName: string;
  phone: string;
  performance: { id: string; title: string } | null;
  preferredDate: string | null;
  preferredTime: PreferredTime | null;
  motivation: string | null;
  consultationMethod: ConsultationMethod | null;
  question: string | null;
  age: number | null;
  gender: Gender | null;
  status: ApplicationStatus;
  processedAt: string | null;
  createdAt: string;
  member: { id: string; name: string } | null;
}

export interface ApplicationListQuery {
  appType?: ApplicationType;
  status?: ApplicationStatus;
  page?: number;
  size?: number;
}

export interface ApplicationActionResponse {
  application: ApplicationItemResponse;
}

export interface RegisterMemberFromApplicationRequest {
  name: string;
  phone?: string | null;
  type: MemberType;
}

export interface RegisterMemberFromApplicationResponse {
  application: ApplicationItemResponse;
  member: MemberListItemResponse;
}

export interface PendingCountResponse {
  count: number;
}

/** 화면 모델 */
export interface Application {
  id: string;
  appType: ApplicationType;
  applicantName: string;
  phone: string;
  performance: { id: string; title: string } | null;
  preferredDate: string | null;
  preferredTime: PreferredTime | null;
  motivation: string | null;
  consultationMethod: ConsultationMethod | null;
  question: string | null;
  age: number | null;
  gender: Gender | null;
  status: ApplicationStatus;
  processedAt: string | null;
  createdAt: string;
  member: { id: string; name: string } | null;
}
