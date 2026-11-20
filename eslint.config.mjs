import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// 서버 전용 코드(src/server, src/_mock)를 화면·공용 컴포넌트·API 계층이 import 하면 시크릿이 번들로 샌다(가이드 A3 경계 규칙).
const SERVER_ONLY_IMPORTS = {
  patterns: [
    {
      group: ['@/src/server/*', '@/src/server', '@/src/_mock/*', '@/src/_mock'],
      message:
        'src/server·src/_mock 은 Route Handler 에서만 import 한다(가이드 A3).',
    },
  ],
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: [
      'src/sections/**/*.{ts,tsx}',
      'src/components/**/*.{ts,tsx}',
      'src/api/**/*.{ts,tsx}',
      'src/layouts/**/*.{ts,tsx}',
      'src/hooks/**/*.{ts,tsx}',
      'src/stores/**/*.{ts,tsx}',
    ],
    rules: { 'no-restricted-imports': ['error', SERVER_ONLY_IMPORTS] },
  },
  globalIgnores([
    '.next/**',
    '.next-*/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'playwright-report/**',
    'test-results/**',
    'src/components/iconify/generated-icons.ts',
  ]),
]);
