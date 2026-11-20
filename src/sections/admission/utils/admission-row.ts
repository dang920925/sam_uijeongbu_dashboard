// ----------------------------------------------------------------------
// 명단 행 표시 모델 — View 는 이 값만 그린다(가공 없음). design SCR-D13 ④⑤⑥ · §6.1b · designer §13.7.4.
// kind: confirmed(남은 인원 있음 — +1·전원·−1) · done(다 들어옴 — "입장 완료" + −1) · pending(입금 확인 + 입장).
// ----------------------------------------------------------------------
import {
  remainingOf,
  type AdmissionItem,
  type AdmissionLine,
} from '@/src/api/admission-mapper';
import { formatTierBreakdown } from '@/src/api/reservation-mapper';
import { MSG_BOOKING } from '@/src/shared/messages/booking';
import { MSG_D13 } from '@/src/shared/messages/d13';

export type AdmissionRowKind = 'confirmed' | 'done' | 'pending';

export interface AdmissionRowModel {
  id: string;
  bookerName: string;
  codeText: string;
  /** 연락처가 없으면 null — 칸을 통째로 숨긴다 */
  phoneText: string | null;
  /** 등급 줄이 없으면(옛 예매) 매수 한 줄로 */
  lines: AdmissionLine[];
  tiersAria: string;
  countText: string;
  kind: AdmissionRowKind;
  status: 'PENDING' | 'CONFIRMED';
  deadlinePassed: boolean;
  amountText: string;
  memo: string | null;
  isAdminSource: boolean;
  /** 다 들어온 행은 관리자 등록·메모가 있을 때만 상태 줄을 둔다("입장 완료"는 동작 줄에) */
  hasStatusLine: boolean;
  /** 남은 인원 1 이면 "전원 입장"은 +1 과 같아 숨긴다(designer 제안) */
  showAll: boolean;
  isMinusDisabled: boolean;
  isBusy: boolean;
  isFlash: boolean;
  plusAria: string;
  allAria: string;
  minusAria: string;
}

/** 금액 "30,000" */
export function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

/** 입금자명 — 공개 예매만 "이름 앞 3자 + 예매번호"(develop S6). 관리자 등록은 값이 없을 수 있어 숨김 */
export function depositorNameOf(item: AdmissionItem): string | null {
  return item.isAdminSource
    ? null
    : `${item.bookerName.slice(0, 3)}${item.code}`;
}

export function linesOf(item: AdmissionItem): AdmissionLine[] {
  return item.lines.length > 0
    ? item.lines
    : [
        {
          tierName: MSG_D13.LINES_FALLBACK,
          quantity: item.quantity,
          isCustom: false,
          isDiscount: false,
        },
      ];
}

export function toAdmissionRowModel(
  item: AdmissionItem,
  state: { busyIds: string[]; flashId: string | null }
): AdmissionRowModel {
  const remaining = remainingOf(item);
  const kind: AdmissionRowKind =
    item.status === 'PENDING'
      ? 'pending'
      : remaining === 0
        ? 'done'
        : 'confirmed';
  const lines = linesOf(item);
  return {
    id: item.id,
    bookerName: item.bookerName,
    codeText: MSG_D13.META_CODE(item.code),
    phoneText: item.phoneLast4 ? MSG_D13.META_PHONE(item.phoneLast4) : null,
    lines,
    tiersAria: tiersAriaOf(lines),
    countText: MSG_D13.COUNT(item.admittedCount, item.quantity),
    kind,
    status: item.status,
    deadlinePassed: item.deadlinePassed,
    amountText: `${formatAmount(item.amount)}${MSG_BOOKING.WON}`,
    memo: item.memo,
    isAdminSource: item.isAdminSource,
    hasStatusLine: kind !== 'done' || item.isAdminSource || item.memo !== null,
    showAll: remaining > 1,
    isMinusDisabled: item.admittedCount === 0,
    isBusy: state.busyIds.includes(item.id),
    isFlash: state.flashId === item.id,
    plusAria: MSG_D13.PLUS_ARIA(item.bookerName),
    allAria: MSG_D13.ALL_ARIA(item.bookerName, remaining),
    minusAria: MSG_D13.MINUS_ARIA(item.bookerName),
  };
}

/** 화면 읽기용 등급 줄 — 할인 줄은 "링크 전용(할인)" 을 붙인다 */
export function tiersAriaOf(lines: AdmissionLine[]): string {
  return MSG_D13.TIERS_ARIA(
    formatTierBreakdown(
      lines.map((line) => ({
        tierName: line.isDiscount
          ? `${line.tierName}(${MSG_D13.DISCOUNT})`
          : line.tierName,
        quantity: line.quantity,
      }))
    )
  );
}
