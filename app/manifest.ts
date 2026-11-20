// ----------------------------------------------------------------------
// PWA 매니페스트(U37 — 기획 project-manager §26, develop §21) → `/manifest.webmanifest`.
// 이름 "SAM 의정부 관리" · 기존 SAM 파비콘 세트(app/icon.svg 와 같은 그림의 192·512 PNG, apple-icon) · standalone.
// 테마·배경색은 대시보드 토큰(사이드바 바탕 semantic.nav.bg)을 그대로 읽는다 — U30 테마가 토큰을 바꾸면 함께 바뀐다.
// 서비스 워커(public/sw.js)는 푸시·알림 클릭만 한다(오프라인 캐시 없음 — J-109).
// ----------------------------------------------------------------------
import type { MetadataRoute } from 'next';

import { PWA_APP_NAME, PWA_SHORT_NAME } from '@/src/config-global';
import { SEMANTIC } from '@/src/theme/semantic';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PWA_APP_NAME,
    short_name: PWA_SHORT_NAME,
    lang: 'ko',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: SEMANTIC.nav.bg,
    background_color: SEMANTIC.nav.bg,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
