// ----------------------------------------------------------------------
// 대시보드 MUI 테마 생성.
// - 브레이크포인트: 640/768/1024/1280(현행 Tailwind 값 = Tailwind 4 기본 — designer J-D2). 이름은 가이드 그대로.
// - spacing 4px: sx 숫자와 Tailwind 스텝(1=4px)이 같은 축이 되게 한다(check-spacing 이 같은 허용 집합으로 검사).
// - 라이트 단일 모드라 cssVariables 는 켜되 colorSchemes 는 light 하나(가이드 §11.10 모드 분기 함정 회피).
// - modularCssLayers: 레이어 순서 문자열을 MUI 가 head 맨 앞에 선언한다. true 로 두면 'mui' 가 Tailwind 보다 먼저 선언돼
//   가장 낮은 레이어가 되고 preflight 가 sx 간격을 지운다(⚠ 2026-11-19 실측). 그래서 Tailwind 순서를 포함한 문자열을 준다.
// ----------------------------------------------------------------------
import { createTheme } from '@mui/material/styles';

import { componentOverrides } from '@/src/theme/overrides/components';
import { RAW } from '@/src/theme/palette';
import { SEMANTIC } from '@/src/theme/semantic';
import { FONT_FAMILY } from '@/src/theme/typography';
import { MOTION } from '@/src/theme/motion';

export const appTheme = createTheme({
  cssVariables: true,
  modularCssLayers: '@layer theme, base, mui, components, utilities;',
  breakpoints: { values: { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 } },
  spacing: 4,
  shape: { borderRadius: 4 },
  palette: {
    mode: 'light',
    primary: {
      main: RAW.slate900,
      dark: RAW.slate800,
      contrastText: RAW.slate50,
    },
    secondary: { main: RAW.slate100, contrastText: RAW.slate900 },
    error: { main: RAW.red600, dark: RAW.red700, contrastText: RAW.white },
    success: {
      main: RAW.green600,
      dark: RAW.green700,
      contrastText: RAW.white,
    },
    warning: { main: RAW.amber700, contrastText: RAW.white },
    info: { main: RAW.blue700, contrastText: RAW.white },
    background: { default: RAW.slate50, paper: RAW.white },
    divider: RAW.slate200,
    text: {
      primary: RAW.slate900,
      secondary: RAW.slate500,
      disabled: RAW.slate400,
    },
    action: { hover: RAW.slate100, selected: RAW.slate100 },
    semantic: SEMANTIC,
  },
  typography: { fontFamily: FONT_FAMILY, htmlFontSize: 16, fontSize: 14 },
  transitions: {
    duration: {
      shortest: MOTION.duration.short,
      shorter: MOTION.duration.short,
      short: MOTION.duration.short,
      standard: MOTION.duration.medium,
      complex: MOTION.duration.long,
      enteringScreen: MOTION.duration.medium,
      leavingScreen: MOTION.duration.short,
    },
    easing: {
      easeInOut: MOTION.easing.standard,
      easeOut: MOTION.easing.enter,
      easeIn: MOTION.easing.exit,
      sharp: MOTION.easing.standard,
    },
  },
  components: componentOverrides,
});
