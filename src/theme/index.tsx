'use client';

// ----------------------------------------------------------------------
// ThemeProvider + Emotion 캐시(App Router). CssBaseline 포함.
// enableCssLayer: Emotion 스타일을 @layer mui 에 넣어 Tailwind utilities 와 순서를 고정한다.
// ----------------------------------------------------------------------
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import type { ReactNode } from 'react';

import { appTheme } from '@/src/theme/create-app-theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <MuiThemeProvider theme={appTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </AppRouterCacheProvider>
  );
}
