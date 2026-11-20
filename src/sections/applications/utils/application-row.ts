// ----------------------------------------------------------------------
// 신청서 → 표·카드·상세 표시 모델(순수 함수). 화면(View)은 이 값만 그린다.
// - 행 액션(사용자 결정 2026-11-19 D6): 대기 = 상세·승인·거절 / 승인+미등록 = 상세·단원으로 등록 / 그 외 = 상세.
// - "단원 등록됨" 판단 = member !== null(develop §3.4 — 삭제된 단원이면 서버가 null).
// - 나이 / 성별: 있는 값만 " / " 로 잇고 둘 다 없으면 null(현행 Applications.tsx:201 join 규칙).
// - 날짜: preferredDate 는 달력 날짜(formatCalendarDate), createdAt·processedAt 은 KST(formatKstDate).
// - U31 보강(design §10.1 · designer §18.3): 유형 짧은 이름, 작품 칩(폭별 "+n"), 희망 일정(참관 날짜 / 상담 방법 · 시간),
//   U29 "일정 취소됨" + "사유: {사유}", 연락(목록 "MM.DD HH:mm" · 상세 "YYYY.MM.DD HH:mm" KST), 진행 Label·메뉴 항목.
// ----------------------------------------------------------------------
import { paths } from '@/app/paths';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D06 } from '@/src/shared/messages/d06';
import type { LabelTone } from '@/src/theme/semantic';
import type { Application } from '@/src/types/application';
import {
  APPLICATION_PROGRESSES_BY_TYPE,
  APPLICATION_PROGRESS_LABEL,
  APPLICATION_STATUS_LABEL,
  CONSULTATION_METHOD_LABEL,
  GENDER_LABEL,
  PREFERRED_TIME_LABEL,
  type ApplicationProgress,
  type ApplicationType,
} from '@/src/types/codes';
import type { MemberFormInput } from '@/src/types/member';
import {
  formatCalendarDate,
  formatKstDate,
  formatKstDateTime,
} from '@/src/utils/kst-date-format';
import {
  splitWorkChips,
  toWorkChips,
  WORK_CHIP_LIMIT,
  type WorkChip,
  type WorkChipSplit,
} from '@/src/sections/applications/utils/work-chips';
import {
  APPLICATION_PROGRESS_TONE,
  APPLICATION_STATUS_TONE,
} from '@/src/utils/status-tone';

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
  /** U31 — 유형 열·pill 짧은 이름("참관"/"상담")과 아이콘 */
  typeLabel: string;
  typeIcon: string;
  /** 작품 칸 — 폭별로 나눈 칩, 칩이 없으면 isWorkEmpty('-') */
  workChips: { lg: WorkChipSplit; md: WorkChipSplit; xs: WorkChipSplit };
  isWorkEmpty: boolean;
  /** 상세 — 참관 작품(참관만) · 관심/희망 작품 전체 */
  observationWork: string | null;
  interestTitle: string;
  interestChips: WorkChip[];
  /** 희망 일정 칸 — 참관 날짜 / 상담 "방법 · 시간", 없으면 '-' */
  scheduleText: string;
  /** U29 — 참관 막은 취소 일정의 사유 글자("사유: …"), 아니면 null */
  scheduleCancelReason: string | null;
  contact: ApplicationContactView;
  progress: ApplicationProgressView;
  /** 상세 전화 링크 — 숫자·+ 만 */
  telHref: string;
}

export interface ApplicationContactView {
  isContacted: boolean;
  /** 목록 "MM.DD HH:mm"(KST) */
  shortTime: string | null;
  /** 상세 "YYYY.MM.DD HH:mm"(KST) */
  fullTime: string | null;
  note: string;
}

export interface ApplicationProgressView {
  value: ApplicationProgress;
  label: string;
  tone: LabelTone;
  /** 불참/보류 — 외곽선 Label(design §10.1) */
  isOutline: boolean;
  /** 입단 — 굵게 + 아이콘 */
  isJoined: boolean;
  /** 거절된 신청 — 진행 메뉴 비활성(APP_012) */
  isLocked: boolean;
  /** 단계 메뉴 항목(유형별) */
  options: { value: ApplicationProgress; label: string }[];
  /** 상세 스텝퍼 — 순서 단계(불참/보류 제외)와 지금 위치 */
  steps: ProgressStep[];
  /** 상세 — 순서 밖 단계(불참/보류) */
  exit: ProgressStep;
}

export interface ProgressStep {
  value: ApplicationProgress;
  label: string;
  state: 'done' | 'current' | 'todo';
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

/** 연락 시각 — 목록 'MM.DD HH:mm' · 상세 'YYYY.MM.DD HH:mm'(KST) */
export function toContactView(
  app: Pick<Application, 'contactedAt' | 'contactNote'>
): ApplicationContactView {
  const full = app.contactedAt ? formatKstDateTime(app.contactedAt) : null;
  const isValid = full !== null && full !== '-';
  return {
    isContacted: app.contactedAt !== null,
    shortTime: isValid ? full.slice(5) : null,
    fullTime: isValid ? full : null,
    note: app.contactNote ?? '',
  };
}

export function toProgressView(
  app: Pick<Application, 'appType' | 'progress' | 'status'>
): ApplicationProgressView {
  const labels = APPLICATION_PROGRESS_LABEL[app.appType];
  const ordered: ApplicationProgress[] = APPLICATION_PROGRESSES_BY_TYPE[
    app.appType
  ].filter((value) => value !== 'DROPPED');
  const currentIndex = ordered.indexOf(app.progress);
  return {
    value: app.progress,
    label: labels[app.progress],
    tone: APPLICATION_PROGRESS_TONE[app.progress],
    isOutline: app.progress === 'DROPPED',
    isJoined: app.progress === 'JOINED',
    isLocked: app.status === 'REJECTED',
    options: APPLICATION_PROGRESSES_BY_TYPE[app.appType].map((value) => ({
      value,
      label: labels[value],
    })),
    // 불참/보류(currentIndex -1)면 순서 단계는 모두 todo
    steps: ordered.map((value, i) => ({
      value,
      label: labels[value],
      state:
        i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'todo',
    })),
    exit: {
      value: 'DROPPED',
      label: labels.DROPPED,
      state: app.progress === 'DROPPED' ? 'current' : 'todo',
    },
  };
}

/** 희망 일정 칸 — 참관 날짜 / 상담 "방법 · 시간"(있는 값만), 없으면 '-' */
export function toScheduleText(
  app: Pick<
    Application,
    'appType' | 'preferredDate' | 'consultationMethod' | 'preferredTime'
  >
): string {
  if (app.appType === 'WORK_OBSERVATION')
    return app.preferredDate
      ? formatCalendarDate(app.preferredDate)
      : MSG_COMMON.EMPTY_VALUE;
  const parts = [
    app.consultationMethod
      ? CONSULTATION_METHOD_LABEL[app.consultationMethod]
      : null,
    app.preferredTime ? PREFERRED_TIME_LABEL[app.preferredTime] : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(' · ') : MSG_COMMON.EMPTY_VALUE;
}

export function toApplicationRow(app: Application): ApplicationRow {
  const ageLabel = app.age !== null ? MSG_D06.AGE(app.age) : null;
  const genderLabel = app.gender ? GENDER_LABEL[app.gender] : null;
  const isObservation = app.appType === 'WORK_OBSERVATION';
  const chips = toWorkChips(app);
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
    detailTitle: isObservation
      ? MSG_D06.DETAIL_OBSERVATION
      : MSG_D06.DETAIL_CONSULTATION,
    typeLabel: isObservation
      ? MSG_D06.TYPE_OBSERVATION
      : MSG_D06.TYPE_CONSULTATION,
    typeIcon: isObservation
      ? 'solar:masks-linear'
      : 'solar:chat-round-dots-linear',
    workChips: {
      lg: splitWorkChips(chips, WORK_CHIP_LIMIT.lg),
      md: splitWorkChips(chips, WORK_CHIP_LIMIT.md),
      xs: splitWorkChips(chips, WORK_CHIP_LIMIT.xs),
    },
    isWorkEmpty: chips.length === 0,
    observationWork: isObservation ? (app.performance?.title ?? null) : null,
    interestTitle: isObservation
      ? MSG_D06.INFO_INTEREST_WORK
      : MSG_D06.INFO_HOPE_WORK,
    interestChips: chips.filter((chip) => chip.kind !== 'observation'),
    scheduleText: toScheduleText(app),
    scheduleCancelReason: app.scheduleCancellation
      ? MSG_D06.CANCEL_REASON(app.scheduleCancellation.reason)
      : null,
    contact: toContactView(app),
    progress: toProgressView(app),
    telHref: `tel:${app.phone.replace(/[^0-9+]/g, '')}`,
  };
}

/** "단원으로 등록" 폼 초기값 — 신청자 이름·연락처 자동 채움, 구분 기본 일반(design SCR-D06) */
export function toRegisterFormInitial(app: Application): MemberFormInput {
  return { name: app.applicantName, phone: app.phone, type: 'GENERAL' };
}

/** 행·카드가 받는 동작 콜백(id 로 부른다) */
export interface ApplicationRowHandlers {
  onView: (id: string) => void;
  onToggleContact: (id: string, contacted: boolean) => void;
  onChangeProgress: (id: string, progress: ApplicationProgress) => void;
}

/** 상세 드로어 하단 동작 콜백 */
export interface ApplicationDetailHandlers {
  onRequestApprove: (id: string) => void;
  onRequestReject: (id: string) => void;
  onRequestRegister: (id: string) => void;
}
