// ----------------------------------------------------------------------
// 입장 체크 검색(S23) — 입력 즉시 불러 둔 명단을 화면에서 거르고, 서버 q 는 디바운스로 보낸다.
// 규칙은 서버와 같게: 이름 포함 · 4자리 숫자면 예매번호 일치 또는 연락처 끝 4자리 일치(develop §11.4).
// 숫자를 4자리 다 치기 전에는 서버에 q 를 보내지 않고 화면에서 앞자리로 거른다(입력 중 빈 화면 방지).
// ----------------------------------------------------------------------
import type { AdmissionItem } from '@/src/api/admission-mapper';
import { toReservationCode } from '@/src/api/reservation-mapper';

const DIGITS = /^[0-9]+$/;

function normalize(query: string): string {
  return query.trim().replace(/^#/, '');
}

/** 예매번호 형식(4자리)이면 그 번호 — 다른 회차 안내 조회 조건 */
export function toSearchCode(query: string): string | null {
  return toReservationCode(query);
}

/** 서버 q — 빈 값·4자리가 아닌 숫자는 '' (명단 전체를 받아 화면에서 거른다) */
export function toServerQuery(query: string): string {
  const q = normalize(query);
  if (!q) return '';
  if (DIGITS.test(q) && q.length !== 4) return '';
  return q;
}

export function filterAdmissionItems(
  items: AdmissionItem[],
  query: string
): AdmissionItem[] {
  const q = normalize(query);
  if (!q) return items;
  if (!DIGITS.test(q)) return items.filter((i) => i.bookerName.includes(q));
  const exact = q.length === 4;
  const hit = (value: string | null) =>
    value !== null && (exact ? value === q : value.startsWith(q));
  return items.filter(
    (i) => i.bookerName.includes(q) || hit(i.code) || hit(i.phoneLast4)
  );
}
