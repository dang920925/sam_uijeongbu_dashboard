// ----------------------------------------------------------------------
// 숫자 입력칸 검증 — 비어 있으면 통과, 아니면 min~max 정수만(develop §11.4 범위).
// ----------------------------------------------------------------------
import { MSG_D11 } from '@/src/shared/messages/d11';

export function validateIntRange(
  value: string,
  min: number,
  max: number
): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (!/^\d+$/.test(trimmed)) return MSG_D11.INVALID_INPUT;
  const n = Number(trimmed);
  return n >= min && n <= max ? null : MSG_D11.INVALID_INPUT;
}
