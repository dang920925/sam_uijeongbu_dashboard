#!/usr/bin/env node
/**
 * check-spacing — 4px 그리드 밖 간격 제로 톨러런스 게이트(가이드 A12·§11.4).
 * 허용 스텝: 4/8/12/16/24/32/40/48/64px = Tailwind 1/2/3/4/6/8/10/12/16, 테마 spacing(4px) 숫자도 같은 집합.
 * 검사: ① Tailwind 간격 유틸(p·m·gap·space·inset 계열)의 값 ② 임의값 [..] ③ sx/스타일 객체의 간격 키 숫자 리터럴.
 * 사용: node scripts/check-spacing.mjs (위반 시 exit 1)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SCAN_DIRS = ['src', 'app'];
const SKIP_DIRS = ['src/theme'];
const ALLOWED = new Set(['0', '1', '2', '3', '4', '6', '8', '10', '12', '16', 'px', 'auto']);
const TW_PREFIX =
  '(?:-?(?:gap-x|gap-y|gap|space-x|space-y|inset-x|inset-y|inset|scroll-mx|scroll-my|scroll-m|scroll-px|scroll-py|scroll-p|px|py|pt|pr|pb|pl|ps|pe|p|mx|my|mt|mr|mb|ml|ms|me|m|top|right|bottom|left))';
const TW_CLASS = new RegExp(`(?:^|[\\s"'\`:])${TW_PREFIX}-([\\w.\\[\\]/%-]+)`, 'g');
const SX_KEYS =
  '(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|rowGap|columnGap|padding|paddingTop|paddingBottom|paddingLeft|paddingRight|paddingInline|paddingBlock|margin|marginTop|marginBottom|marginLeft|marginRight|marginInline|marginBlock|spacing)';
const SX_NUM = new RegExp(`\\b${SX_KEYS}\\s*[:=]\\s*\\{?\\s*(-?\\d+(?:\\.\\d+)?)\\b`, 'g');
const SX_RESPONSIVE = new RegExp(`\\b${SX_KEYS}\\s*:\\s*\\{([^}]*)\\}`, 'g');
const BP_NUM = /\b(?:xs|sm|md|lg|xl)\s*:\s*(-?\d+(?:\.\d+)?)/g;
const SX_ALLOWED = new Set(['0', '1', '2', '3', '4', '6', '8', '10', '12', '16']);
const COMMENT = /^\s*(\/\/|\*|\/\*)/;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(ts|tsx)$/.test(name) && !/\.spec\.tsx?$/.test(name) ? [path] : [];
  });
}

const violations = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    if (SKIP_DIRS.some((d) => file.startsWith(`${d}/`))) continue;
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (COMMENT.test(line)) return;
        for (const m of line.matchAll(TW_CLASS)) {
          const value = m[1].replace(/^-/, '');
          if (value.includes('[') || !ALLOWED.has(value)) {
            if (/^(full|1\/2)$/.test(value) && /(top|right|bottom|left|inset)/.test(m[0])) continue;
            violations.push(`${file}:${i + 1}: Tailwind 간격 "${m[0].trim()}"`);
          }
        }
        for (const m of line.matchAll(SX_RESPONSIVE)) {
          for (const bp of m[1].matchAll(BP_NUM)) {
            if (!SX_ALLOWED.has(bp[1].replace(/^-/, ''))) {
              violations.push(`${file}:${i + 1}: sx 반응형 간격 "${m[0].trim()}"`);
            }
          }
        }
        for (const m of line.matchAll(SX_NUM)) {
          if (!SX_ALLOWED.has(m[1].replace(/^-/, ''))) {
            violations.push(`${file}:${i + 1}: sx 간격 "${m[0].trim()}"`);
          }
        }
      });
  }
}

if (violations.length > 0) {
  console.error(`check-spacing: 4px 그리드 밖 간격 ${violations.length}건`);
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}
console.log('check-spacing: 위반 0건');
