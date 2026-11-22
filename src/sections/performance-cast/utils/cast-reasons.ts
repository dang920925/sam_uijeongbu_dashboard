// ----------------------------------------------------------------------
// SCR-D14 "공개 안 됨 — 이유" 라벨(design §12) — 서버 publicNow(develop §17.2 규칙)가 false 일 때만 이유를 고른다.
// 우선순위: 공개 스위치 → 작품 비노출 → (배역) 비노출 배우 포함·노출 배우 없음 / (참여자) 참여자·연결 대상 비노출.
// ----------------------------------------------------------------------
import { MSG_D14 } from '@/src/shared/messages/d14';
import type { AdminCredit, RoleCast } from '@/src/types/cast';

export interface CastPublicContext {
  castPublic: boolean;
  performanceVisible: boolean;
}

function contextReason(ctx: CastPublicContext): string | null {
  if (!ctx.castPublic) return MSG_D14.REASON_SWITCH_OFF;
  if (!ctx.performanceVisible) return MSG_D14.REASON_PERFORMANCE_HIDDEN;
  return null;
}

/** 배역(또는 회차 칸) — name null 은 "출연" 묶음 */
export function castReason(
  publicNow: boolean,
  roleName: string | null,
  actors: readonly RoleCast[],
  ctx: CastPublicContext
): string | null {
  if (publicNow) return null;
  return (
    contextReason(ctx) ??
    (roleName === null
      ? MSG_D14.REASON_NO_VISIBLE_ACTOR
      : actors.some((a) => !a.isVisible)
        ? MSG_D14.REASON_HIDDEN_ACTOR
        : null)
  );
}

export function creditReason(
  credit: AdminCredit,
  ctx: CastPublicContext
): string | null {
  if (credit.publicNow) return null;
  return (
    contextReason(ctx) ??
    (!credit.isVisible
      ? MSG_D14.REASON_CREDIT_HIDDEN
      : credit.staff && !credit.staff.isVisible
        ? MSG_D14.REASON_STAFF_HIDDEN
        : credit.member && !credit.member.isVisible
          ? MSG_D14.REASON_MEMBER_HIDDEN
          : null)
  );
}
