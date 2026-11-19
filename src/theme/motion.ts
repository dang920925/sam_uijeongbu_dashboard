// ----------------------------------------------------------------------
// 모션 토큰(designer.md §2.7 — MD3 duration·easing).
// reduced-motion 대체는 overrides(전역 CssBaseline) 에서 transition 시간을 0 으로 줄인다.
// ----------------------------------------------------------------------
export const MOTION = {
  duration: { short: 150, medium: 250, long: 350 },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    enter: 'cubic-bezier(0, 0, 0, 1)',
    exit: 'cubic-bezier(0.3, 0, 1, 1)',
  },
} as const;
