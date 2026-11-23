// ----------------------------------------------------------------------
// 입금 알림 기기 매퍼·도우미(U43).
// - 목록 행: 이름 · 마지막 수신 시각(KST, 없으면 "아직 받은 알림 없음").
// - 앱 판별: 안드로이드 앱 'SAM 의정부 관리' WebView 는 User-Agent 끝에 ` SAMAdmin/<버전>` 을 붙인다.
// - 딥링크: samadmin://pair?token=<토큰>&name=<이름> — 앱이 운영 대시보드 출처에서 온 것만 받는다.
// ----------------------------------------------------------------------
import { MSG_D15_DEPOSIT } from '@/src/shared/messages/d15-deposit-devices';
import type { DepositDeviceResponse } from '@/src/types/deposit-device';
import { formatKstDateTime } from '@/src/utils/kst-date-format';

export interface DepositDeviceRow {
  id: string;
  name: string;
  lastSeenText: string;
}

const ADMIN_APP_UA = /(?:^|\s)SAMAdmin\/[0-9A-Za-z._-]+\s*$/;

export const DEFAULT_DEPOSIT_DEVICE_NAME = '관리자 폰';
export const DEPOSIT_DEVICE_NAME_MAX = 40;

export function toDepositDeviceRow(
  item: DepositDeviceResponse
): DepositDeviceRow {
  return {
    id: item.id,
    name: item.name,
    lastSeenText: item.lastSeenAt
      ? `${MSG_D15_DEPOSIT.LAST_SEEN} ${formatKstDateTime(item.lastSeenAt)}`
      : MSG_D15_DEPOSIT.LAST_SEEN_NONE,
  };
}

/** User-Agent 끝이 `SAMAdmin/<버전>` 이면 관리자 앱 WebView */
export function isAdminAppUserAgent(userAgent: string | null): boolean {
  return userAgent !== null && ADMIN_APP_UA.test(userAgent);
}

/** 앱 등록 딥링크 — 토큰·이름은 URL 인코딩 */
export function buildPairingLink(token: string, name: string): string {
  const query = new URLSearchParams({ token, name });
  return `samadmin://pair?${query.toString()}`;
}

/** 이름 입력 검사 — 앞뒤 공백을 지운 1~40자면 null, 아니면 오류 문구 */
export function validateDepositDeviceName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > DEPOSIT_DEVICE_NAME_MAX)
    return MSG_D15_DEPOSIT.NAME_INVALID;
  return null;
}
