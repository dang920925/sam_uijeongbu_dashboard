'use client';

// ----------------------------------------------------------------------
// ManualReservationDialog — 예매 수동 등록(design SCR-D12 "수동 등록 Dialog" · SCR-D13 "현장 예매 등록").
// 회차* · 매수* · 이름* · 연락처* · 초대 단원(선택) · 메모 · "입금 확인까지 처리" 체크 (+ D13 입장 인원).
// ⚠ 리드가 props 계약만 먼저 고정한 자리 — D12 작업자(W2)가 구현을 채운다. props 는 바꾸지 않는다.
// ----------------------------------------------------------------------
import type { ManualReservationFormInput } from '@/src/api/reservation-mapper';

export interface ManualReservationShowOption {
  id: string;
  /** 예 "12/12(토) 14:00" */
  label: string;
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
  /** "입금 확인까지 처리" 기본값 — D12 false · D13 true(design SCR-D13 하단) */
  defaultConfirmNow: boolean;
  /** D13: 입금 확인까지 처리할 때 입장 인원(0~매수) 칸을 보인다 */
  showAdmitNow: boolean;
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
