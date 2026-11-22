// ----------------------------------------------------------------------
// 역할 토큰(semantic) — 화면은 이 이름만 부른다(가이드 §11.3). 대시보드는 U30 안 A '백스테이지' 다크 단일 모드
// (사용자 2026-11-20 Q4 — J-D3 라이트 단일을 대체. 라이트·다크 전환 기능은 범위 밖). 값 출처 design/u30/tokens-A.css.
// 상태 배지 매핑(현행 색 유지, 충돌 C-10 U1 우선 · designer.md §2.3):
//   신청 대기=warning · 승인=success · 거절=error / 공연 진행중=success · 예정=warning · 종료=neutral
//   반 활성=success · 비활성=neutral / 단원 배우=info · 일반=neutral / "단원 등록됨"=neutral
// ----------------------------------------------------------------------
import { ALPHA, RAW } from '@/src/theme/palette';

export type LabelTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export interface SemanticTokens {
  label: Record<LabelTone, { bg: string; fg: string }>;
  nav: {
    /** 단색(bgcolor 용) — 그라디언트를 못 쓰는 곳의 대체 */
    bg: string;
    /** U30 A 버건디 벨벳(주름 줄무늬 + 위쪽 골드 조명) — backgroundImage 용 */
    bgImage: string;
    /** 활성 항목 왼쪽 골드 막대 */
    activeBar: string;
    /** 로고 글자(골드) */
    brand: string;
    border: string;
    item: string;
    itemHoverBg: string;
    itemActiveBg: string;
    itemActive: string;
    /** (U40) 메뉴 숫자 배지 — 흰 글자 대비 5.25:1(AA), 내비 바탕 대비 3.2:1 이상(비텍스트 3:1) */
    badgeBg: string;
    badgeFg: string;
  };
  alert: {
    warningBg: string;
    warningBorder: string;
    warningFg: string;
    errorBg: string;
    errorBorder: string;
    /** alert--error 글자(qa1 QA1-006: red-600/red-50 4.41 → red-700 5.91) */
    errorFg: string;
    infoBg: string;
    infoFg: string;
  };
  snackbar: { bg: string; fg: string; successIcon: string; errorIcon: string };
  kpi: {
    blue: string;
    emerald: string;
    amber: string;
    purple: string;
    iconFg: string;
  };
  surface: {
    muted: string;
    hover: string;
    skeleton: string;
    placeholder: string;
  };
  /** onMuted: slate-100 위 부가 글자(비선택 pill·선택 행) — qa1 QA1-006 slate-500 4.34 → slate-600 6.92 */
  text: {
    header: string;
    onImage: string;
    onMuted: string;
    onPlaceholder: string;
  };
  conflict: { bg: string; border: string; fg: string };
  /** U30 — 헤더(반투명 + 블러) */
  header: { bg: string; border: string };
  /** U30 — 표 머리 바탕·글자 */
  tableHead: { bg: string; fg: string };
  /** U30 — 진행 막대(입장 현황) */
  progress: { track: string; fill: string };
  /** U30 — 바탕 스포트라이트(body backgroundImage) */
  spotlight: string;
  /** R1 designer §13.2·§13.11 — 현장(D13) 입력·보조 버튼 테두리 3:1 이상(`--color-input-border-strong` slate-500 4.76) */
  input: { borderStrong: string };
  /** R1 designer §13.2 `--color-success-soft-bg/-border` — D13 입장 완료 행 */
  successSoft: { bg: string; border: string };
  scrim: { dialog: string; image: string; chip: string };
  /** U35 좌석 지도·배치 편집 칸 */
  seat: {
    availableBg: string;
    availableBorder: string;
    availableFg: string;
    selectedBg: string;
    selectedFg: string;
    soldBg: string;
    soldFg: string;
    mineBg: string;
    mineFg: string;
    aisleBorder: string;
    voidBg: string;
    stageBg: string;
    stageFg: string;
  };
}

export const SEMANTIC: SemanticTokens = {
  label: {
    neutral: { bg: ALPHA.labelNeutralBg, fg: RAW.textSoft },
    info: { bg: ALPHA.labelInfoBg, fg: RAW.labelInfo },
    success: { bg: ALPHA.labelSuccessBg, fg: RAW.labelSuccess },
    warning: { bg: ALPHA.labelWarningBg, fg: RAW.warningText },
    error: { bg: ALPHA.labelErrorBg, fg: RAW.labelError },
  },
  nav: {
    bg: RAW.navTop,
    bgImage: [
      `radial-gradient(260px 200px at 50% -40px, ${ALPHA.navGlow}, transparent 70%)`,
      `repeating-linear-gradient(90deg, ${ALPHA.navPleatDark} 0 2px, transparent 2px 9px, ${ALPHA.navPleatLight} 9px 16px, transparent 16px 22px)`,
      `linear-gradient(180deg, ${RAW.navTop} 0%, ${RAW.navMid} 55%, ${RAW.navBottom} 100%)`,
    ].join(', '),
    activeBar: RAW.gold,
    brand: RAW.goldHover,
    border: ALPHA.navDivider,
    item: RAW.navFg,
    itemHoverBg: ALPHA.navHoverBg,
    itemActiveBg: ALPHA.navActiveBg,
    itemActive: RAW.navFgActive,
    badgeBg: RAW.danger,
    badgeFg: RAW.white,
  },
  alert: {
    warningBg: ALPHA.labelWarningBg,
    warningBorder: ALPHA.labelWarningBg,
    warningFg: RAW.warningText,
    errorBg: ALPHA.labelErrorBg,
    errorBorder: ALPHA.labelErrorBg,
    errorFg: RAW.errorText,
    infoBg: ALPHA.labelInfoBg,
    infoFg: RAW.labelInfo,
  },
  snackbar: {
    bg: RAW.raised,
    fg: RAW.text,
    successIcon: RAW.successText,
    errorIcon: RAW.errorText,
  },
  // 타일 바탕(비텍스트) — 색 이름대로 대응: amber=골드 · emerald=그린 · purple=바이올렛 · blue=커튼 로즈(A 에 파랑 없음).
  // 화면이 아이콘 색을 하나(iconFg)만 받으므로 골드 밝은 단계 하나로 칠한다.
  kpi: {
    blue: ALPHA.kpiRoseBg,
    emerald: ALPHA.kpiGreenBg,
    amber: ALPHA.kpiGoldBg,
    purple: ALPHA.kpiVioletBg,
    iconFg: RAW.goldHover,
  },
  surface: {
    muted: RAW.muted,
    hover: RAW.raised,
    skeleton: RAW.muted,
    placeholder: RAW.muted,
  },
  text: {
    header: RAW.headerFg,
    onImage: RAW.white,
    onMuted: RAW.text2,
    onPlaceholder: RAW.text2,
  },
  conflict: {
    bg: ALPHA.labelErrorBg,
    border: ALPHA.labelErrorBg,
    fg: RAW.labelError,
  },
  input: { borderStrong: RAW.borderStrong },
  successSoft: { bg: ALPHA.rowDoneBg, border: ALPHA.labelSuccessBg },
  // U35 좌석 지도 — U30 다크 토큰으로 옮김(v1.3.0 합치기): 빈 좌석 = 올린 면, 판매 = 칩 테두리 면, 무대 = muted
  seat: {
    availableBg: RAW.raised,
    availableBorder: RAW.borderStrong,
    availableFg: RAW.text,
    selectedBg: RAW.orange700,
    selectedFg: RAW.white,
    soldBg: RAW.chipBorder,
    soldFg: RAW.text2,
    mineBg: RAW.blue700,
    mineFg: RAW.white,
    aisleBorder: RAW.divider,
    voidBg: RAW.bg,
    stageBg: RAW.muted,
    stageFg: RAW.text,
  },
  scrim: {
    dialog: 'rgba(0 0 0 / 0.6)',
    image: 'rgba(0 0 0 / 0.6)',
    chip: 'rgba(0 0 0 / 0.4)',
  },
  header: { bg: ALPHA.headerBg, border: RAW.divider },
  tableHead: { bg: RAW.tableHead, fg: RAW.text2 },
  progress: {
    track: RAW.divider,
    fill: `linear-gradient(90deg, ${RAW.goldDeep}, ${RAW.goldHover})`,
  },
  spotlight: `radial-gradient(1100px 520px at 38% -180px, ${ALPHA.spotlight}, transparent 70%)`,
};
