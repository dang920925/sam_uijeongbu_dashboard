// ----------------------------------------------------------------------
// 타이포 티어(가이드 §11.5 기본값 = 현행 대시보드 Tailwind text-xs12/sm14/base16/lg18/2xl24 와 일치).
// 글자 크기 숫자는 이 파일에만 둔다. 화면은 Typo 컴포넌트만 쓴다.
// 글꼴: U30 안 A — Pretendard(designer §15.3 · §15.6-1, J-D4 시스템 스택을 대체). 로드는 theme/index.tsx 의 <link>.
// ----------------------------------------------------------------------
export const FONT_FAMILY =
  '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif';

/** Pretendard 가변 글꼴(동적 subset) — 홈페이지 /apply 와 같은 CDN·버전 */
export const PRETENDARD_CSS =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';

export const TYPO_TIERS = {
  caption: 12,
  tag: 13,
  badge: 14,
  body: 16,
  title: 18,
  subtitle: 20,
  subhead: 24,
  head: 28,
} as const;

export type TypoTier = keyof typeof TYPO_TIERS;

export const TYPO_WEIGHTS = {
  Light: 300,
  Regular: 400,
  Medium: 500,
  Semibold: 600,
  Bold: 700,
} as const;

export type TypoWeight = keyof typeof TYPO_WEIGHTS;

export const LINE_HEIGHT = { tight: 1.15, snug: 1.375, normal: 1.5 } as const;
