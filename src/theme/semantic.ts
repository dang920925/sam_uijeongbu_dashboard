// ----------------------------------------------------------------------
// 역할 토큰(semantic) — 화면은 이 이름만 부른다(가이드 §11.3). 대시보드는 라이트 단일 모드
// (현행 유일 모드, designer 자체 결정 J-D3 — 다크 토글은 미승인 보이는 변화).
// 상태 배지 매핑(현행 색 유지, 충돌 C-10 U1 우선 · designer.md §2.3):
//   신청 대기=warning · 승인=success · 거절=error / 공연 진행중=success · 예정=warning · 종료=neutral
//   반 활성=success · 비활성=neutral / 단원 배우=info · 일반=neutral / "단원 등록됨"=neutral
// ----------------------------------------------------------------------
import { RAW } from '@/src/theme/palette';

export type LabelTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export interface SemanticTokens {
  label: Record<LabelTone, { bg: string; fg: string }>;
  nav: {
    bg: string;
    border: string;
    item: string;
    itemHoverBg: string;
    itemActiveBg: string;
    itemActive: string;
  };
  alert: {
    warningBg: string;
    warningBorder: string;
    warningFg: string;
    errorBg: string;
    errorBorder: string;
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
  text: { header: string; onImage: string };
  conflict: { bg: string; border: string; fg: string };
  scrim: { dialog: string; image: string; chip: string };
}

export const SEMANTIC: SemanticTokens = {
  label: {
    neutral: { bg: RAW.slate100, fg: RAW.slate700 },
    info: { bg: RAW.blue100, fg: RAW.blue700 },
    success: { bg: RAW.green100, fg: RAW.green800 },
    warning: { bg: RAW.yellow100, fg: RAW.yellow800 },
    error: { bg: RAW.red100, fg: RAW.red700 }, // ⚑ 거절 filled → pastel(§11.3)
  },
  nav: {
    bg: RAW.slate900,
    border: RAW.slate700,
    item: RAW.slate400,
    itemHoverBg: RAW.slate800,
    itemActiveBg: RAW.slate700,
    itemActive: RAW.white,
  },
  alert: {
    warningBg: RAW.amber50,
    warningBorder: RAW.amber200,
    warningFg: RAW.amber700,
    errorBg: RAW.red50,
    errorBorder: RAW.red200,
    infoBg: RAW.blue50,
    infoFg: RAW.blue700,
  },
  snackbar: {
    bg: RAW.slate900,
    fg: RAW.white,
    successIcon: RAW.kpiEmerald,
    errorIcon: RAW.red300,
  },
  kpi: {
    blue: RAW.kpiBlue,
    emerald: RAW.kpiEmerald,
    amber: RAW.kpiAmber,
    purple: RAW.kpiPurple,
    iconFg: RAW.white,
  },
  surface: {
    muted: RAW.slate100,
    hover: RAW.slate50,
    skeleton: RAW.slate100,
    placeholder: RAW.slate200,
  },
  text: { header: RAW.slate700, onImage: RAW.white },
  conflict: { bg: RAW.red50, border: RAW.red200, fg: RAW.red300 },
  scrim: {
    dialog: 'rgba(0 0 0 / 0.5)',
    image: 'rgba(0 0 0 / 0.6)',
    chip: 'rgba(0 0 0 / 0.4)',
  },
};
