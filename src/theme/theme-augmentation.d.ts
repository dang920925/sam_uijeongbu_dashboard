// MUI 팔레트에 역할 토큰(semantic) 키를 더한다 — 화면은 'semantic.label.success.bg' 처럼 경로로 부른다.
import type { SemanticTokens } from '@/src/theme/semantic';

declare module '@mui/material/styles' {
  interface Palette {
    semantic: SemanticTokens;
  }
  interface PaletteOptions {
    semantic?: SemanticTokens;
  }
}

export {};
