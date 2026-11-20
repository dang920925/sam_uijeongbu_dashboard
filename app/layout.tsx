// ----------------------------------------------------------------------
// RootLayout — ThemeProvider(MUI·Emotion) → 스낵바 → QueryProvider.
// 대시보드는 라이트 단일 모드(현행 유일 모드 — designer J-D3)라 색 모드 스크립트를 두지 않는다.
// 글꼴은 현행 시스템 스택 + Noto Sans KR(designer J-D4) — 웹폰트 로드 없음.
// ----------------------------------------------------------------------
import './globals.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { QueryProvider } from '@/src/components/query-provider';
import { AppSnackbarProvider } from '@/src/components/snackbar/snackbar-provider';
import { APP_TITLE, PWA_APP_NAME } from '@/src/config-global';
import { ThemeProvider } from '@/src/theme';

export const metadata: Metadata = {
  title: APP_TITLE,
  robots: { index: false, follow: false },
  // U37 — iOS '홈 화면에 추가' 때 standalone 으로 열리고 이 이름을 쓴다(매니페스트는 app/manifest.ts 가 자동 연결)
  appleWebApp: { capable: true, title: PWA_APP_NAME },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='ko'>
      <body>
        <ThemeProvider>
          <AppSnackbarProvider>
            <QueryProvider>{children}</QueryProvider>
          </AppSnackbarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
