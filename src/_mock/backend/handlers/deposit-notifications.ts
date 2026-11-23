// ----------------------------------------------------------------------
// 목 입금 알림(R2 — server `/admin/deposit-notifications*` · `/internal/deposits` 흉내). 서버 판정의 간단판:
// - 금액: `N원` 후보 중 앞(같은 줄)에 '잔액'·'출금'이 없는 것, 값이 하나로 정해질 때만(아니면 금액 모름)
// - 찾기: 입금 대기 예매의 입금자명 전체(공백 제거·소문자)가 글자에 있을 때만 일치. 예매번호만·이름만이면 불일치(단서만)
// - 출처: appPackage(없으면 source)가 허용 3개 밖이거나 '입금' 없는 카카오톡이면 IGNORED_SOURCE(저장만)
// - 판정: 0건 UNMATCHED · 2건+ NEEDS_REVIEW(MULTIPLE_MATCH) · 금액 모름 AMOUNT_UNREADABLE · 합 = 금액 AUTO_CONFIRMED ·
//   모자람 PARTIAL · 넘침 OVERPAID. 자동 확정은 켬(서버 기본값). 정확한 규칙·경계는 server 단위 테스트가 정본.
// - 목 전용 `POST __mock/deposit` { source?, title?, text } — 폰 웹훅 대신 알림 하나를 넣는다(E2E 시드).
// ----------------------------------------------------------------------
import {
  apiError,
  json,
  newId,
  nowIso,
  paginate,
  str,
  validationError,
  type MockContext,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import {
  getStore,
  type MockDepositNotification,
  type MockReservation,
} from '@/src/_mock/backend/mock-store';
import type {
  DepositNotificationItem,
  DepositNotificationStatus,
  DepositPreview,
  DepositReservationSummary,
  DepositReviewReason,
} from '@/src/types/deposit-notification';

const COUNTED: DepositNotificationStatus[] = [
  'AUTO_CONFIRMED',
  'PARTIAL',
  'MANUALLY_MATCHED',
];
const ALLOWED_PACKAGES = [
  'com.kakaobank.channel',
  'com.kakao.talk',
  'com.kakaopay.app',
];
const OPEN: DepositNotificationStatus[] = [
  'PARTIAL',
  'NEEDS_REVIEW',
  'UNMATCHED',
];
// 서버와 같게 — 무시는 판정 안 함까지, 거르기 없는 목록은 무시함·판정 안 함을 뺀다(운영 스모크 2026-11-23)
const IGNORABLE: DepositNotificationStatus[] = [...OPEN, 'IGNORED_SOURCE'];
const HIDDEN_BY_DEFAULT: DepositNotificationStatus[] = [
  'IGNORED',
  'IGNORED_SOURCE',
];

function receivedOf(reservationId: string): number {
  return getStore()
    .depositNotifications.filter(
      (d) => d.reservationId === reservationId && COUNTED.includes(d.status)
    )
    .reduce((sum, d) => sum + (d.parsedAmount ?? 0), 0);
}

function summaryOf(r: MockReservation): DepositReservationSummary {
  return {
    id: r.id,
    code: r.code,
    performanceId: r.performanceId,
    performanceTitle:
      getStore().performances.find((p) => p.id === r.performanceId)?.title ??
      '',
    depositorName: r.depositorName,
    amount: r.amount,
    receivedAmount: receivedOf(r.id),
    status: r.status,
    version: r.version,
  };
}

function toItem(d: MockDepositNotification): DepositNotificationItem {
  const reservation = d.reservationId
    ? getStore().reservations.find((r) => r.id === d.reservationId)
    : undefined;
  return {
    id: d.id,
    receivedAt: d.receivedAt,
    source: d.source,
    appPackage: d.appPackage,
    appName: d.appName,
    title: d.title,
    text: d.text,
    parsedAmount: d.parsedAmount,
    status: d.status,
    reviewReason: d.reviewReason,
    resolvedAt: d.resolvedAt,
    reservation: reservation ? summaryOf(reservation) : null,
  };
}

function parseAmounts(text: string): number[] {
  const values: number[] = [];
  for (const line of text.split('\n')) {
    let prev = 0;
    for (const m of line.matchAll(/([0-9][0-9,]*)\s*원/g)) {
      const before = line.slice(prev, m.index);
      prev = m.index + m[0].length;
      if (/잔액|출금|결제/.test(before)) continue;
      const value = Number(m[1].replaceAll(',', ''));
      if (value > 0) values.push(value);
    }
  }
  return values;
}

interface Judged {
  amount: number | null;
  candidates: number[];
  matchedBy: 'DEPOSITOR' | null;
  unmatchedHint: 'CODE_ONLY' | 'NAME_ONLY' | null;
  matches: MockReservation[];
  status: DepositPreview['status'];
  reviewReason: DepositReviewReason | null;
  reservation: MockReservation | null;
}

function judge(text: string): Judged {
  const candidates = parseAmounts(text);
  const amount = new Set(candidates).size === 1 ? candidates[0] : null;
  const pending = getStore().reservations.filter((r) => r.status === 'PENDING');
  const flat = text.replace(/\s+/g, '').toLowerCase();
  const nameOf = (r: MockReservation) =>
    (r.depositorName ?? '').replace(/\s+/g, '').toLowerCase();
  const matches = pending.filter(
    (r) => nameOf(r) !== '' && flat.includes(nameOf(r))
  );
  const codes = new Set(
    text
      .replace(/[0-9][0-9,]*\s*원/g, ' ')
      .match(/(?<![0-9])[0-9]{4}(?![0-9])/g)
  );
  const hasCode = pending.some((r) => codes.has(r.code));
  const hasName = pending.some((r) => {
    const name = nameOf(r).replace(/[0-9]{4}$/, '');
    return name !== '' && flat.includes(name);
  });
  const base = {
    amount,
    candidates,
    matchedBy: matches.length > 0 ? ('DEPOSITOR' as const) : null,
    unmatchedHint:
      matches.length > 0
        ? null
        : hasCode
          ? ('CODE_ONLY' as const)
          : hasName
            ? ('NAME_ONLY' as const)
            : null,
    matches,
  };
  if (matches.length === 0)
    return {
      ...base,
      status: 'UNMATCHED',
      reviewReason: null,
      reservation: null,
    };
  if (matches.length > 1)
    return {
      ...base,
      status: 'NEEDS_REVIEW',
      reviewReason: 'MULTIPLE_MATCH',
      reservation: null,
    };
  const r = matches[0];
  if (amount === null)
    return {
      ...base,
      status: 'NEEDS_REVIEW',
      reviewReason: 'AMOUNT_UNREADABLE',
      reservation: r,
    };
  const total = receivedOf(r.id) + amount;
  if (total > r.amount)
    return {
      ...base,
      status: 'NEEDS_REVIEW',
      reviewReason: 'OVERPAID',
      reservation: r,
    };
  if (total < r.amount)
    return { ...base, status: 'PARTIAL', reviewReason: null, reservation: r };
  return {
    ...base,
    status: 'AUTO_CONFIRMED',
    reviewReason: null,
    reservation: r,
  };
}

function joinText(body: Record<string, unknown>): string {
  return [str(body.title), str(body.text)]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join('\n');
}

function confirm(r: MockReservation, by: 'AUTO' | 'MANUAL') {
  r.status = 'CONFIRMED';
  r.confirmedBy = by;
  r.confirmedAt = nowIso();
  r.version += 1;
}

function findIn(
  ctx: MockContext,
  statuses: DepositNotificationStatus[]
): MockDepositNotification | Response {
  const found = getStore().depositNotifications.find(
    (d) => d.id === ctx.params.id
  );
  if (!found)
    return apiError(ctx, 404, 'DEP_001', '입금 알림을 찾을 수 없습니다.');
  if (!statuses.includes(found.status))
    return apiError(ctx, 409, 'DEP_002', '이미 처리된 입금 알림입니다.');
  return found;
}

export const depositNotificationRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/deposit-notifications$/,
    auth: true,
    handle: (ctx) => {
      const status = ctx.query.get('status');
      const rows = getStore()
        .depositNotifications.filter((d) =>
          status ? d.status === status : !HIDDEN_BY_DEFAULT.includes(d.status)
        )
        .sort(
          (a, b) =>
            b.receivedAt.localeCompare(a.receivedAt) || b.id.localeCompare(a.id)
        )
        .map(toItem);
      return json(paginate(rows, ctx.query));
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/deposit-notifications\/received-amounts$/,
    auth: true,
    handle: (ctx) => {
      const performanceId = ctx.query.get('performanceId');
      if (!performanceId) return validationError(ctx);
      const items = getStore()
        .reservations.filter(
          (r) => r.performanceId === performanceId && r.status === 'PENDING'
        )
        .map((r) => ({ reservationId: r.id, receivedAmount: receivedOf(r.id) }))
        .filter((item) => item.receivedAmount > 0);
      return json({ items });
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/deposit-notifications\/preview$/,
    auth: true,
    handle: (ctx) => {
      if (typeof ctx.body.text !== 'string') return validationError(ctx);
      const text = joinText(ctx.body);
      const judged = judge(text);
      const preview: DepositPreview = {
        text,
        amount: judged.amount,
        amountCandidates: judged.candidates,
        matchedBy: judged.matchedBy,
        unmatchedHint: judged.unmatchedHint,
        status: judged.status,
        reviewReason: judged.reviewReason,
        autoConfirm: true,
        matches: judged.matches.map(summaryOf),
      };
      return json(preview);
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/deposit-notifications\/(?<id>[^/]+)\/match$/,
    auth: true,
    handle: (ctx) => {
      const found = findIn(ctx, OPEN);
      if (found instanceof Response) return found;
      const r = getStore().reservations.find(
        (x) => x.id === ctx.body.reservationId
      );
      if (!r)
        return apiError(ctx, 404, 'RSV_013', '예매 정보를 찾을 수 없습니다.');
      if (r.version !== ctx.body.version)
        return apiError(
          ctx,
          409,
          'RSV_007',
          '다른 곳에서 먼저 바뀌었습니다. 새로고침 후 다시 시도해주세요.'
        );
      if (r.status !== 'PENDING')
        return apiError(
          ctx,
          409,
          'RSV_008',
          '지금 상태에서는 할 수 없는 처리입니다.'
        );
      confirm(r, 'MANUAL');
      Object.assign(found, {
        status: 'MANUALLY_MATCHED',
        reviewReason: null,
        reservationId: r.id,
        resolvedAt: nowIso(),
      });
      return json(toItem(found));
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/deposit-notifications\/(?<id>[^/]+)\/ignore$/,
    auth: true,
    handle: (ctx) => {
      const found = findIn(ctx, IGNORABLE);
      if (found instanceof Response) return found;
      Object.assign(found, {
        status: 'IGNORED',
        reviewReason: null,
        resolvedAt: nowIso(),
      });
      return json(toItem(found));
    },
  },
  {
    // 목 전용 — 폰 웹훅 대신 알림 하나를 받아 판정·저장(자동 확정 켬)
    method: 'POST',
    pattern: /^\/v1\/__mock\/deposit$/,
    auth: false,
    handle: (ctx) => {
      const text = joinText(ctx.body);
      const pkg = (
        str(ctx.body.appPackage) ??
        str(ctx.body.source) ??
        ''
      ).toLowerCase();
      const ignored =
        pkg !== '' &&
        (!ALLOWED_PACKAGES.includes(pkg) ||
          (pkg === 'com.kakao.talk' && !text.includes('입금')));
      const judged = judge(ignored ? '' : text);
      const status = ignored ? 'IGNORED_SOURCE' : judged.status;
      if (status === 'AUTO_CONFIRMED' && judged.reservation)
        confirm(judged.reservation, 'AUTO');
      const row: MockDepositNotification = {
        id: newId(),
        receivedAt: nowIso(),
        source: str(ctx.body.source),
        appPackage: str(ctx.body.appPackage),
        appName: str(ctx.body.appName),
        title: str(ctx.body.title),
        text: str(ctx.body.text),
        parsedAmount: judged.amount,
        status,
        reviewReason: ignored ? null : judged.reviewReason,
        resolvedAt: null,
        reservationId: ignored ? null : (judged.reservation?.id ?? null),
      };
      getStore().depositNotifications.push(row);
      return json({ id: row.id, status: row.status }, 202);
    },
  },
];
