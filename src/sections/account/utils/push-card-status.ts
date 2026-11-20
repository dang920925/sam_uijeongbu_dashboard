// ----------------------------------------------------------------------
// SCR-D15 '예매 알림' 카드 상태(U37) — 순수 함수.
// 순서: 불러오는 중 → 불러오기 오류 → 서버 푸시 꺼짐(공개키 null) → 브라우저 미지원 → 권한 거부 → 사용 가능.
// ----------------------------------------------------------------------
import type { PushPermission } from '@/src/lib/web-push-browser';

export type PushCardStatus =
  'loading' | 'error' | 'server-disabled' | 'unsupported' | 'denied' | 'ready';

export interface PushCardStatusInput {
  isLoading: boolean;
  isError: boolean;
  publicKey: string | null | undefined;
  /** null = 브라우저 상태를 아직 읽지 않음 */
  permission: PushPermission | null;
}

export function toPushCardStatus(input: PushCardStatusInput): PushCardStatus {
  if (input.isError) return 'error';
  if (input.isLoading || input.permission === null) return 'loading';
  if (!input.publicKey) return 'server-disabled';
  if (input.permission === 'unsupported') return 'unsupported';
  if (input.permission === 'denied') return 'denied';
  return 'ready';
}
