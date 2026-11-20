// ----------------------------------------------------------------------
// 신청서 → 표·카드·상세 표시 모델(순수 함수). 화면(View)은 이 값만 그린다.
// - 행 액션(사용자 결정 2026-11-19 D6): 대기 = 상세·승인·거절 / 승인+미등록 = 상세·단원으로 등록 / 그 외 = 상세.
// - "단원 등록됨" 판단 = member !== null(develop §3.4 — 삭제된 단원이면 서버가 null).
// - 나이 / 성별: 있는 값만 " / " 로 잇고 둘 다 없으면 null(현행 Applications.tsx:201 join 규칙).
// - 날짜: preferredDate 는 달력 날짜(formatCalendarDate), createdAt·processedAt 은 KST(formatKstDate).
// ----------------------------------------------------------------------
import { paths } from '@/app/paths';
import { MSG_D06 } from '@/src/shared/messages/d06';
import type { LabelTone } from '@/src/theme/semantic';
import type { Application } from '@/src/types/application';
import {
  APPLICATION_STATUS_LABEL,
  CONSULTATION_METHOD_LABEL,
  GENDER_LABEL,
  PREFERRED_TIME_LABEL,
  type ApplicationType,
} from '@/src/types/codes';
import type { MemberFormInput } from '@/src/types/member';
import { formatCalendarDate, formatKstDate } from '@/src/utils/kst-date-format';
import { APPLICATION_STATUS_TONE } from '@/src/utils/status-tone';

/** review = 승인·거절 가능(대기) · register = 단원으로 등록 가능 · none = 상세만 */
export type ApplicationAction = 'review' | 'register' | 'none';

export interface ApplicationRow {
  id: string;
  appType: ApplicationType;
  applicantName: string;
  phone: string;
  ageLabel: string | null;
  genderLabel: string | null;
  /** 표 "나이 / 성별" 칸 — 값 없으면 null */
  ageGender: string | null;
  performanceTitle: string | null;
  preferredDate: string | null;
  methodLabel: string | null;
  preferredTimeLabel: string | null;
  motivation: string | null;
  question: string | null;
  createdAt: string;
  processedAt: string | null;
  statusLabel: string;
  statusTone: LabelTone;
  /** 등록된 단원 — 상세의 단원 이름 링크(단원 관리에서 그 단원 패널) */
  member: { name: string; href: string } | null;
  action: ApplicationAction;
  detailTitle: string;
}

export function getApplicationAction(app: Application): ApplicationAction {
  if (app.status === 'PENDING') return 'review';
  if (app.status === 'APPROVED' && app.member === null) return 'register';
  return 'none';
}

export function joinAgeGender(
  ageLabel: string | null,
  genderLabel: string | null
): string | null {
  const parts = [ageLabel, genderLabel].filter(
    (part): part is string => part !== null
  );
  return parts.length > 0 ? parts.join(' / ') : null;
}

export function toApplicationRow(app: Application): ApplicationRow {
  const ageLabel = app.age !== null ? MSG_D06.AGE(app.age) : null;
  const genderLabel = app.gender ? GENDER_LABEL[app.gender] : null;
  return {
    id: app.id,
    appType: app.appType,
    applicantName: app.applicantName,
    phone: app.phone,
    ageLabel,
    genderLabel,
    ageGender: joinAgeGender(ageLabel, genderLabel),
    performanceTitle: app.performance?.title ?? null,
    preferredDate: app.preferredDate
      ? formatCalendarDate(app.preferredDate)
      : null,
    methodLabel: app.consultationMethod
      ? CONSULTATION_METHOD_LABEL[app.consultationMethod]
      : null,
    preferredTimeLabel: app.preferredTime
      ? PREFERRED_TIME_LABEL[app.preferredTime]
      : null,
    motivation: app.motivation?.trim() ? app.motivation : null,
    question: app.question?.trim() ? app.question : null,
    createdAt: formatKstDate(app.createdAt),
    processedAt: app.processedAt ? formatKstDate(app.processedAt) : null,
    statusLabel: APPLICATION_STATUS_LABEL[app.status],
    statusTone: APPLICATION_STATUS_TONE[app.status],
    member: app.member
      ? { name: app.member.name, href: paths.members.detail(app.member.id) }
      : null,
    action: getApplicationAction(app),
    detailTitle:
      app.appType === 'WORK_OBSERVATION'
        ? MSG_D06.DETAIL_OBSERVATION
        : MSG_D06.DETAIL_CONSULTATION,
  };
}

/** "단원으로 등록" 폼 초기값 — 신청자 이름·연락처 자동 채움, 구분 기본 일반(design SCR-D06) */
export function toRegisterFormInitial(app: Application): MemberFormInput {
  return { name: app.applicantName, phone: app.phone, type: 'GENERAL' };
}

/** 행·카드·상세가 받는 동작 콜백(id 로 부른다) */
export interface ApplicationRowHandlers {
  onView: (id: string) => void;
  onRequestApprove: (id: string) => void;
  onRequestReject: (id: string) => void;
  onRequestRegister: (id: string) => void;
}
