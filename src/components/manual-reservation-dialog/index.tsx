'use client';

// ----------------------------------------------------------------------
// ManualReservationDialog — 예매 수동 등록(design SCR-D12 "수동 등록 Dialog" · SCR-D13 "현장 예매 등록").
// develop §11.10 보강(무료·특별 초대도 여기로) · design §6.1b · designer §13.11 dialog-manual(-direct):
// 회차* · 이름* · 연락처(선택) · 입력 방식 "등급별 수량 / 직접 입력"(이름 기본 "직접 입력" + 매수 + 금액) ·
// "금액 직접 정하기"(0원 허용) · 상태 "입금 대기 / 확정" · 초대 단원(선택) · 메모 · (확정이면) 입장 인원.
// 남은 좌석보다 많으면 저장 불가. D13 은 입장 인원을 상태 바로 아래에 둔다(designer §13.11 남은 확인 6).
// ⚠ 리드가 props 계약만 먼저 고정한 자리 — D12 작업자(W2)가 구현을 채운다. props 는 바꾸지 않는다.
// ----------------------------------------------------------------------
import type { ManualReservationFormInput } from '@/src/api/reservation-mapper';

export interface ManualReservationShowOption {
  id: string;
  /** 예 "12/12(토) 14:00" */
  label: string;
  /** 남은 좌석(null = 좌석 수 미정 — 제한 없음) */
  remainingSeats: number | null;
}

/** 고를 수 있는 등급(사용 중인 등급 — PUBLIC·LINK_ONLY 모두) */
export interface ManualReservationTierOption {
  id: string;
  name: string;
  price: number;
  visibility: 'PUBLIC' | 'LINK_ONLY';
}

export interface ManualReservationInviterOption {
  memberId: string;
  name: string;
}

export interface ManualReservationDialogProps {
  open: boolean;
  /** 회차 선택지 — fixedShowId 가 있으면 선택 칸 대신 그 회차를 읽기 전용으로 보인다 */
  showOptions: ManualReservationShowOption[];
  /** D13: 고른 회차 고정 */
  fixedShowId?: string | null;
  /** 초대 단원 선택지 — 비거나 없으면 칸을 숨긴다 */
  inviterOptions?: ManualReservationInviterOption[];
  /** 등급 선택지 — 비면 "직접 입력" 방식만 보인다 */
  tierOptions: ManualReservationTierOption[];
  /** 상태 기본값 — D12 'PENDING' · D13 'CONFIRMED'(designer §13.11) */
  defaultStatus: 'PENDING' | 'CONFIRMED';
  /** D13: 확정일 때 입장 인원(0~매수, 기본 = 매수) 칸을 상태 바로 아래에 보인다. D12 는 확정일 때 맨 아래 */
  admitNowPlacement: 'afterStatus' | 'bottom';
  isSubmitting: boolean;
  /** 폼 위 오류 문구(RSV_003 등) — 없으면 null */
  errorMessage: string | null;
  onSubmit: (input: ManualReservationFormInput) => void;
  onClose: () => void;
}

/** 자리 — W2 가 구현한다 */
export function ManualReservationDialog(props: ManualReservationDialogProps) {
  void props;
  return null;
}
