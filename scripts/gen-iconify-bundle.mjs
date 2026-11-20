#!/usr/bin/env node
/**
 * gen-iconify-bundle — 사용하는 solar 아이콘만 오프라인 번들로 만든다(가이드 §11.8 "런타임 CDN 호출 없음").
 * 입력: scripts/icon-list.json(아이콘 이름), @iconify-json/solar(devDependency — 설치 후 오프라인).
 * 출력: src/components/iconify/generated-icons.ts (기계 생성 — 손으로 고치지 않는다).
 * 사용: pnpm icons
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const solar = require('@iconify-json/solar/icons.json');
const names = JSON.parse(readFileSync('scripts/icon-list.json', 'utf8'));

const icons = {};
for (const name of names) {
  const icon = solar.icons[name];
  if (!icon) {
    console.error(`gen-iconify-bundle: solar 세트에 "${name}" 이 없습니다.`);
    process.exit(1);
  }
  icons[name] = icon;
}

const collection = { prefix: 'solar', width: solar.width ?? 24, height: solar.height ?? 24, icons };
const out = `// 기계 생성 파일 — scripts/gen-iconify-bundle.mjs 로 다시 만든다. 손으로 고치지 않는다.
import type { IconifyJSON } from '@iconify/react';

export const SOLAR_ICONS: IconifyJSON = ${JSON.stringify(collection)};
`;
writeFileSync('src/components/iconify/generated-icons.ts', out);
console.log(`gen-iconify-bundle: ${names.length}개 아이콘 → src/components/iconify/generated-icons.ts`);
