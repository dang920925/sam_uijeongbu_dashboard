#!/usr/bin/env node
/**
 * check-hex — 색 hex 하드코딩 제로 톨러런스 게이트(가이드 A12·§11.3).
 * 사용: node scripts/check-hex.mjs (위반 시 exit 1)
 * 화이트리스트: src/theme/**, src/components/logo/**, *.spec.ts(x), app/global-error.tsx, 기계 생성 아이콘 번들.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SCAN_DIRS = ['src', 'app'];
const WHITELIST_DIRS = ['src/theme', 'src/components/logo'];
const WHITELIST_FILES = ['app/global-error.tsx', 'src/components/iconify/generated-icons.ts'];
const HEX = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{8}\b/;
const COMMENT = /^\s*(\/\/|\*|\/\*)/;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(ts|tsx|css|mjs)$/.test(name) ? [path] : [];
  });
}

const isWhitelisted = (file) =>
  WHITELIST_DIRS.some((d) => file.startsWith(`${d}/`)) ||
  WHITELIST_FILES.includes(file) ||
  /\.spec\.tsx?$/.test(file);

const violations = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    if (isWhitelisted(file)) continue;
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (COMMENT.test(line)) return;
        if (HEX.test(line)) violations.push(`${file}:${i + 1}: ${line.trim()}`);
      });
  }
}

if (violations.length > 0) {
  console.error(`check-hex: hex 색 리터럴 ${violations.length}건 — 테마 토큰을 쓰세요.`);
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}
console.log('check-hex: 위반 0건');
