#!/usr/bin/env node
/**
 * check-font-size — 글자 크기는 Typo 컴포넌트만(가이드 A8·§11.5).
 * src/·app/ 에서 fontSize·font-size·Tailwind text-(xs|sm|base|lg|xl…) 크기 유틸을 찾는다.
 * 허용: src/theme/**(티어 정의), src/components/typo/**.
 * 사용: node scripts/check-font-size.mjs (위반 시 exit 1)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SCAN_DIRS = ['src', 'app'];
const SKIP_DIRS = ['src/theme', 'src/components/typo'];
const SKIP_FILES = ['app/global-error.tsx'];
const PATTERNS = [
  /\bfontSize\s*:/,
  /font-size\s*:/,
  /(?:^|[\s"'`])text-(?:xs|sm|base|lg|[2-9]?xl|\[\d)/,
];
const COMMENT = /^\s*(\/\/|\*|\/\*)/;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(ts|tsx|css)$/.test(name) && !/\.spec\.tsx?$/.test(name) ? [path] : [];
  });
}

const violations = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    if (SKIP_DIRS.some((d) => file.startsWith(`${d}/`)) || SKIP_FILES.includes(file)) continue;
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (COMMENT.test(line)) return;
        if (PATTERNS.some((p) => p.test(line))) violations.push(`${file}:${i + 1}: ${line.trim()}`);
      });
  }
}

if (violations.length > 0) {
  console.error(`check-font-size: 글자 크기 리터럴 ${violations.length}건 — Typo 를 쓰세요.`);
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}
console.log('check-font-size: 위반 0건');
