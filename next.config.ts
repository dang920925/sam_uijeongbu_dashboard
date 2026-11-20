// ----------------------------------------------------------------------
// Next.js 설정.
// - Docker 는 standalone, Vercel 은 자체 빌드 출력(standalone 이 켜지면 Route Handler 가 500 — 가이드 A2).
// - NEXT_DIST_DIR: 병렬 작업자가 같은 저장소에서 dev 서버를 따로 띄울 때 빌드 출력 폴더를 나눈다(style-guide §8.7 규칙 4).
// - 이미지는 next/image unoptimized 로만 쓴다(Vercel 이미지 변환 사용량을 쓰지 않음 — 기획 R13).
// ----------------------------------------------------------------------
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: 'standalone' as const }),
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
