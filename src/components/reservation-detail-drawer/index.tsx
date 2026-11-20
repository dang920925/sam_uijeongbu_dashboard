'use client';

// ----------------------------------------------------------------------
// ReservationDetailDrawer — 예매 상세 드로어(지휘자 추가 요청 2026-11-20 "예매번호로 찾기").
// 헤더 빠른 검색(1건이면 바로 열림)과 예매 관리(D12 — 예매번호 정확히 일치·행 선택)가 같이 쓴다.
// 내용: 예매번호 · 공연명(있으면) · 회차 · 예매자(이름·연락처) · 매수·금액 · 입금자명 · 입금 기한 ·
//       상태 Label(ReservationStatusLabel) · 입장 {a}/{q} · 초대 · 메모 · 처리 이력(확정·취소 시각).
// lg·md 오른쪽 드로어(폭 LAYOUT.panel 이상), xs 전체 폭. 처리 버튼은 화면이 actions 로 넣는다.
// ⚠ 리드가 props 계약만 먼저 고정한 자리 — D12 작업자(W2)가 구현을 채운다. props 는 바꾸지 않는다.
// ----------------------------------------------------------------------
import type { ReactNode } from 'react';

import type { Reservation } from '@/src/api/reservation-mapper';

export interface ReservationDetailDrawerProps {
  open: boolean;
  /** null 이면 닫힌 상태로 본다 */
  reservation: Reservation | null;
  /** 공연명(Reservation.performanceTitle 이 없을 때 화면이 아는 값) */
  performanceTitle?: string | null;
  /** 아래 처리 버튼 자리(D12: 입금 확인·취소·메모 / 빠른 검색: "예매 관리에서 보기" 링크) */
  actions?: ReactNode;
  onClose: () => void;
}

/** 자리 — W2 가 구현한다 */
export function ReservationDetailDrawer(props: ReservationDetailDrawerProps) {
  void props;
  return null;
}
