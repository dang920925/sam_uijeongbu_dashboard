// ----------------------------------------------------------------------
// 입장 체크 매퍼(FN-36, develop §11.4 입장 체크 + §11.10 AdmissionBoard.items[] 보강) — 계약 ↔ 화면 모델. 순수 함수(+ spec).
// - 명단은 받은 순간에 "남은 인원 있는 예매 먼저 · 이름순"으로 정렬해 캐시에 둔다. 낙관 표시·처리 결과는
//   자리를 바꾸지 않고 그 행만 바꾼다(손가락 아래 행이 움직이지 않게 — designer §13.7.4 1.5). 다음 조회 때 다시 정렬.
// - otherShowMatches 는 서버가 항상 배열로 준다(최대 5건 — back-end.md §14.4, 지휘자 전달). 보조 조회 없음.
// ----------------------------------------------------------------------
import type {
  AdminShowWithTitleResponse,
  AdmissionBoardResponse,
  AdmissionItemResponse,
  AdmissionOtherShowMatch,
  AdmissionResultResponse,
  AdmissionSummaryResponse,
} from '@/src/types/booking';

/** 다른 회차 안내 최대 건수(design §6.1a) */
export const OTHER_SHOW_MATCH_LIMIT = 5;

export interface AdmissionShow {
  id: string;
  /** /admin/shows 응답에 있으면(계약 변경 요청) — 없으면 null → 현장 등록은 직접 입력만 */
  performanceId: string | null;
  performanceTitle: string;
  showDate: string;
  startTime: string;
  remainingSeats: number | null;
}

export interface AdmissionLine {
  tierName: string;
  quantity: number;
  isCustom: boolean;
  /** 링크 전용(LINK_ONLY) 등급 = 할인 등급 info Label */
  isDiscount: boolean;
}

export interface AdmissionItem {
  id: string;
  code: string;
  bookerName: string;
  /** 연락처가 없으면(관리자 등록) null — 끝 4자리 칸을 숨긴다 */
  phoneLast4: string | null;
  quantity: number;
  lines: AdmissionLine[];
  isAdminSource: boolean;
  admittedCount: number;
  status: 'PENDING' | 'CONFIRMED';
  amount: number;
  deadlinePassed: boolean;
  memo: string | null;
  version: number;
}

export type AdmissionSummary = AdmissionSummaryResponse;

export interface AdmissionBoard {
  show: {
    id: string;
    performanceTitle: string;
    showDate: string;
    startTime: string;
    venue: string | null;
  };
  summary: AdmissionSummary;
  items: AdmissionItem[];
  /** null = 서버가 안 줌(보조 조회 필요) */
  otherShowMatches: AdmissionOtherShowMatch[];
}

export interface AdmissionResult {
  item: AdmissionItem;
  summary: AdmissionSummary;
}

export function fromAdmissionShowResponse(
  res: AdminShowWithTitleResponse
): AdmissionShow {
  return {
    id: res.id,
    performanceId: res.performanceId || null,
    performanceTitle: res.performanceTitle ?? '',
    showDate: res.showDate,
    startTime: res.startTime.slice(0, 5),
    remainingSeats: res.remainingSeats ?? null,
  };
}

export function fromAdmissionItemResponse(
  res: AdmissionItemResponse
): AdmissionItem {
  return {
    id: res.id,
    code: res.code,
    bookerName: res.bookerName,
    phoneLast4: res.phoneLast4 || null,
    quantity: res.quantity,
    lines: (res.items ?? []).map((line) => ({
      tierName: line.tierName,
      quantity: line.quantity,
      isCustom: line.isCustom,
      isDiscount: !line.isCustom && line.visibility === 'LINK_ONLY',
    })),
    isAdminSource: res.source === 'ADMIN',
    admittedCount: res.admittedCount,
    status: res.status,
    amount: res.amount,
    // 기한이 없으면(관리자 등록) 서버도 false — 값이 비어 오면 false(지휘자 결정)
    deadlinePassed: res.deadlinePassed === true,
    memo: res.memo || null,
    version: res.version,
  };
}

/** 남은 인원(입금 대기 포함) */
export function remainingOf(item: AdmissionItem): number {
  return Math.max(item.quantity - item.admittedCount, 0);
}

/** 남은 인원이 있는 예매 먼저(입금 대기 포함), 입장 완료는 아래 — 각 묶음 안은 이름 가나다순 */
export function sortAdmissionItems(items: AdmissionItem[]): AdmissionItem[] {
  return [...items].sort((a, b) => {
    const doneA = remainingOf(a) === 0 ? 1 : 0;
    const doneB = remainingOf(b) === 0 ? 1 : 0;
    if (doneA !== doneB) return doneA - doneB;
    return a.bookerName.localeCompare(b.bookerName, 'ko');
  });
}

export function fromAdmissionBoardResponse(
  res: AdmissionBoardResponse
): AdmissionBoard {
  return {
    show: {
      id: res.show.id,
      performanceTitle: res.show.performanceTitle ?? '',
      showDate: res.show.showDate,
      startTime: res.show.startTime.slice(0, 5),
      venue: res.show.venue || null,
    },
    summary: res.summary,
    items: sortAdmissionItems(res.items.map(fromAdmissionItemResponse)),
    otherShowMatches: (res.otherShowMatches ?? []).slice(
      0,
      OTHER_SHOW_MATCH_LIMIT
    ),
  };
}

export function fromAdmissionResultResponse(
  res: AdmissionResultResponse
): AdmissionResult {
  return {
    item: fromAdmissionItemResponse(res.item),
    summary: res.summary,
  };
}

function replaceItem(
  board: AdmissionBoard,
  id: string,
  update: (item: AdmissionItem) => AdmissionItem
): AdmissionItem[] {
  return board.items.map((item) => (item.id === id ? update(item) : item));
}

/** 낙관 표시 — 입장 증감(행 자리는 그대로) */
export function applyAdmissionDelta(
  board: AdmissionBoard,
  id: string,
  delta: number
): AdmissionBoard {
  return {
    ...board,
    items: replaceItem(board, id, (item) => ({
      ...item,
      admittedCount: item.admittedCount + delta,
    })),
    summary: {
      ...board.summary,
      admittedCount: board.summary.admittedCount + delta,
      notAdmittedQty: board.summary.notAdmittedQty - delta,
    },
  };
}

/** 낙관 표시 — 입금 확인 + 입장(입금 대기 → 확정, 입장 = admit). 행이 이 명단에 없으면 그대로 */
export function applyConfirmAndAdmit(
  board: AdmissionBoard,
  id: string,
  admit: number
): AdmissionBoard {
  const target = board.items.find((item) => item.id === id);
  if (!target || target.status !== 'PENDING') return board;
  return {
    ...board,
    items: replaceItem(board, id, (item) => ({
      ...item,
      status: 'CONFIRMED',
      admittedCount: admit,
    })),
    summary: {
      ...board.summary,
      confirmedQty: board.summary.confirmedQty + target.quantity,
      admittedCount: board.summary.admittedCount + admit,
      notAdmittedQty: board.summary.notAdmittedQty + target.quantity - admit,
      pendingCount: board.summary.pendingCount - 1,
      pendingQty: board.summary.pendingQty - target.quantity,
    },
  };
}

/** 입금 확인 + 입장 낙관 표시 되돌리기 — 처리 전 행(previous)으로 돌리고 현황도 빼 준다 */
export function revertConfirmAndAdmit(
  board: AdmissionBoard,
  previous: AdmissionItem,
  admit: number
): AdmissionBoard {
  const current = board.items.find((item) => item.id === previous.id);
  if (!current || current.status !== 'CONFIRMED') return board;
  return {
    ...board,
    items: replaceItem(board, previous.id, () => previous),
    summary: {
      ...board.summary,
      confirmedQty: board.summary.confirmedQty - previous.quantity,
      admittedCount: board.summary.admittedCount - admit,
      notAdmittedQty:
        board.summary.notAdmittedQty - (previous.quantity - admit),
      pendingCount: board.summary.pendingCount + 1,
      pendingQty: board.summary.pendingQty + previous.quantity,
    },
  };
}

/** 서버 응답(AdmissionResult)으로 맞춤 — 행은 자리에서 바꾸고 현황은 덮어쓴다 */
export function applyAdmissionResult(
  board: AdmissionBoard,
  result: AdmissionResult
): AdmissionBoard {
  return {
    ...board,
    items: replaceItem(board, result.item.id, () => result.item),
    summary: result.summary,
  };
}
