<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:sam-dashboard-agent-rules -->
# SAM 의정부 대시보드 프로젝트 에이전트 지침

## 0. 사용자 언어
대화·주석·커밋·문서·테스트 제목은 한국어, 식별자는 영어.

## 1. 프로젝트 개요
아마추어 극단 "Stage And Me 의정부" 관리자 대시보드(SCR-D00~D10). 형제 저장소: `../server`(NestJS API — 계약 정본 `output/sam-uijeongbu/project-manager-develop.md` §3), `../db`(Flyway), `../client`(홈페이지). 브라우저는 서버를 직접 부르지 않고 BFF(`app/api/*`)만 부른다.

## 2. 기술 스택 (설치 버전)
Next.js 16.4.6(App Router, Turbopack) · React 19.3.1 · TypeScript 5.9.3 · @mui/material 9.5.0 + Emotion 11 · Tailwind 4.3.5(레이아웃·간격만) · TanStack Query 5.108.0 · Zustand 5.1.0 · notistack 3.0.2 · @iconify/react 6(solar 오프라인 번들) · Vitest 4.1.12 · Playwright 1.65.1 · ESLint 10.15.0 · Prettier 3.10.1 · pnpm 10 · Node 24.x.

## 3. 코드 스타일
`.prettierrc`(singleQuote·jsxSingleQuote·semi·tabWidth 2·trailingComma es5·printWidth 80·arrowParens always). 작업 끝에 `pnpm format`.

## 4. 프로젝트 구조
```
app/                      라우트만. (dashboard)/ 그룹 = AdminLayout, login/, api/auth/{login,logout}, api/backend/[...path], paths.ts
proxy.ts                  세션 쿠키 없으면 /login 으로
src/sections/<feature>/   화면 MVVM(view/ container·view·use-*-view-model, components/, utils/)
src/components/           공용 UI(Typo·PageHead·DataTable·AdminDialog·ConfirmDialog·FormField·ImageUploadField·…)
src/layouts/admin/        사이드바·레일·드로어·헤더
src/api/                  2~4층: <domain>.ts · <domain>-mapper.ts(+spec) · <domain>-queries.ts · endpoints.ts · root-keys.ts
src/lib/api-client.ts     1층 전송 래퍼(유일한 fetch/XHR)
src/server/               서버 전용(쿠키·업스트림·설정·재검증) — Route Handler 와 서버 컴포넌트 page.tsx(설정 읽기 — 예 readClientPublicUrl)에서만 import
src/_mock/backend/        MOCK_BACKEND=true 일 때 BFF 가 쓰는 계약 목(서버 전용)
src/theme/                palette(hex 유일 위치)·semantic·typography·overrides
src/types/                계약 DTO·코드값 라벨
src/shared/messages/      화면 문구 상수(MSG-<화면>-<자리>)
src/utils/ hooks/ stores/ 순수 함수·공용 훅·zustand
e2e-pw/                   Playwright(auth.setup·화면별 spec·screens.capture)
scripts/                  check-hex·check-spacing·check-font-size·gen-iconify-bundle
```

## 5. 아키텍처 기본 원칙
| 계층 | 파일 | 역할 | 금지 |
| --- | --- | --- | --- |
| Container | `*-container.tsx` | 상태 분기(로딩·빈·오류) | 50줄 초과·UI 트리·API |
| View | `*-view.tsx`, `components/*` | props 로만 렌더 | 가공(.filter/.sort/.reduce)·API·store |
| ViewModel | `use-*-view-model.ts` | Query/Mutation·가공·콜백 | JSX |
| 요청 함수 | `src/api/<domain>.ts` | endpoints + api-client + 매퍼 | 화면에서 직접 fetch |
| 매퍼 | `src/api/<domain>-mapper.ts` | 계약 ↔ 화면 모델(빈 문자열 → null) | 부작용 |
| 쿼리 | `src/api/<domain>-queries.ts` | `<domain>Keys`(all = ROOT_KEYS) + 훅 | — |

## 6. 핵심 패턴
- 인증: BFF 로그인이 `__Host-sam_admin` httpOnly·Secure·SameSite=Strict 쿠키를 발급, `/api/backend/*` 가 Bearer 로 중계. 401 → QueryProvider 가 쿠키 삭제 후 /login 1회. 로그인 화면 401 은 `meta.suppressGlobalUnauthorized` 로 문구 표시.
- 업로드(FN-18): `POST /admin/uploads` → `signedUrl` 로 파일 raw PUT(진행률 XHR) → `publicUrl` 을 저장 요청에.
- 날짜: 서버 datetime UTC Z → `formatKstDate`/`formatKstDateTime`, 입력은 `fromKstDateTimeInput`(+09:00).
- 목: `MOCK_BACKEND=true`(Vercel 금지, fail-fast). 시드 없음 — 테스트가 `fixture-` 픽스처를 만든다.
- 홈페이지 즉시 반영(U27): 공용 BFF 프록시가 `/admin/*` 변경 2xx 뒤 `after()` 로 `POST {CLIENT_PUBLIC_URL}/api/revalidate`(Bearer `REVALIDATE_SECRET` ≥32자) — 실패해도 응답 그대로. 경로→태그 표 `src/server/revalidate.ts`.
- 예매(R1): 쿼리 키는 `ROOT_KEYS.booking` 접두사 하나 — 예매·입장·회차·등급 변경 뒤 이것으로 함께 무효화. 연락처는 서버가 숫자만 주므로 `formatPhone` 으로 표시. 계정 변경(U25)은 BFF `app/api/auth/account` 가 새 토큰으로 쿠키를 바꾼다.

## 7. 타입 안전성
`any` 금지(ESLint error). unknown + 가드. Props 는 `XxxProps` interface.

## 8. 네이밍 규칙
파일 kebab-case, 컴포넌트 PascalCase, 훅 `use-*`, 스토어 `*-store.ts`, 요청 함수 fetchX/createX/saveX/deleteX, 매퍼 toXRequest/fromXResponse, 상수 UPPER_SNAKE, 경로 `paths.*`, 임포트 `@/src/...`·`@/app/...`.

## 9. 커밋 · 브랜치 · 푸시
한국어 Conventional Commits(`feat(admin-신청서): …`), 1 커밋 1 논리 변경, 끝에 Co-Authored-By. 작업 브랜치 → develop PR. **에이전트는 push 하지 않는다.** `git config core.hooksPath .githooks`(pnpm install 의 prepare 가 설정).

## 10. 테스트 작성 규칙
매퍼·utils·스토어·ViewModel 가공은 Vitest `*.spec.ts`(소스 옆, 제목 한국어 "…한다", AAA). UI 흐름은 `e2e-pw/*.spec.ts`(desktop + mobile, `resetMock` 후 픽스처). 기능 변경 = 테스트 동반.

연동 E2E(실서버): `e2e-pw/integration/**` — `INT_API_BASE_URL`(기본 :4200)·`INT_ADMIN_USERNAME/PASSWORD`(로컬 픽스처 관리자, 잠금 시험 `INT_LOCK_USERNAME`·로그아웃 시험 `INT_SESSION_USERNAME`)·`INT_RELAY_SECRET`·`INT_DB_CONTAINER`·`INT_DB_NAME` 를 넣고 `pnpm test:e2e:integration`(앱 :4230, next dev, 목 없음). 픽스처는 `fixture-integration-` 접두사로 서버 API 로 만들고 그 접두사 행만 지운다(integration-developer.md §1).

## 11. 위반 자가 점검 체크리스트
- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build` 통과, `pnpm test:e2e` 통과
- [ ] View 에 가공·API·store 없음, Container ≤50줄, 1 파일 1 export
- [ ] hex·Tailwind 색·fontSize·4px 밖 간격 없음(게이트), 글자는 Typo
- [ ] 문구는 `src/shared/messages` 상수, 근거 없는 문구는 `[MSG-… — 확인 필요]`
- [ ] xs/md/lg 확인, 터치 ≥44, 표는 xs 카드
- [ ] `docs/screen-inventory.md` 갱신
<!-- END:sam-dashboard-agent-rules -->

<!-- BEGIN:design-rules -->
# 디자인 시스템 규칙
> 규칙의 단일 출처. 시안 정본 `output/sam-uijeongbu/design/`(tokens.css `.app-admin`·components.css·screens), 토큰 `src/theme/*`.

## 간격 체계
허용 4/8/12/16/24/32/40/48/64px(Tailwind 1·2·3·4·6·8·10·12·16, sx 숫자 같은 집합 — 테마 spacing 4px). 본문 여백 xs 16 / md↑ 24(AdminLayout main 소유), 카드 패딩 24(xs 16), 섹션 간 24, 표 셀 12/16(dense), 라벨↔입력 4, 폼 필드 간 16.

## 표현 형식 결정 트리
요약 = 현황판(KPI) · 목록 = 테이블(dense, xs 카드 — D06·D08·D10 은 lg 미만 카드) · 갤러리 = 카드 그리드 · 폼 = Dialog(현행 유지, 사진 있으면 wide 640) · 확인 = ConfirmDialog(제목 없이 현행 문구).

## 색·토큰
라이트 단일 모드. primary slate-900, 본문 slate-50/white, 글자 slate-900·slate-500(slate-100 위 부가 글자 slate-600), error red-600(alert 글자 red-700), success green-700, alert warning amber-700(⚑ 보정값 — 사용자 확정 2026-11-19 · qa1 QA1-006). 상태색: 신청 대기 warning·승인 success·거절 error / 공연 진행중 success·예정 warning·종료 neutral / 반 활성 success·비활성 neutral / 배우 info·일반 neutral / 단원 등록됨 neutral. 칩은 pastel(filled 금지). 아이콘 solar linear 단일(`scripts/icon-list.json` → `pnpm icons`). hex 화이트리스트: `src/theme/**`, `app/global-error.tsx`, `*.spec.ts`, 생성 아이콘 번들.

## 화면 텍스트 위계
Typo 티어 Caption 12·Tag 13·Badge 14·Body 16·Title 18·SubTitle 20·SubHead 24·Head 28. 대시보드 화면은 4티어(title·body·badge·caption), 로그인 로고만 SubHead. 페이지 h1·카드·다이얼로그 제목 Title.Bold, 행 주 항목 Body.Semibold, 셀·라벨·버튼 Badge, 날짜·배지·오류 Caption.

## 반응형 레이아웃
브레이크포인트 xs 0·sm 640·md 768·lg 1024·xl 1280(MUI·Tailwind 같은 축). lg 사이드바 240 / md 레일 72 / xs 햄버거 드로어 240. xs 다이얼로그 전체 화면. 터치 ≥44.

## 집행
프리미티브 `PageHead`·`SectionStack`·`DataTable`·`AdminDialog`·`ConfirmDialog`·`FormField`·`Label`·`SegmentPill`·`EmptyContent`·`ErrorRetry`. 게이트 `pnpm lint`(check-hex·check-spacing·check-font-size). 형식별 정본·인벤토리 `docs/screen-inventory.md` — 새 화면은 정본을 복제해 시작하고 인벤토리를 갱신한다.

## 운영 교훈
- ⚠ 2026-11-19: MUI `modularCssLayers: true` 는 `mui` 레이어를 Tailwind 보다 먼저 선언해 preflight 가 sx 간격을 지웠다 → 테마에 `'@layer theme, base, mui, components, utilities;'` 문자열을 준다.
- ⚠ 2026-11-19: MUI 9 Typography `color` prop 은 `'text.secondary'` 경로를 무시한다 → Typo 는 색을 sx 로 넘긴다.
- ⚠ 2026-11-19: OutlinedInput root 의 테두리 규칙이 오류·포커스 테두리를 덮었다 → `.Mui-error`·`.Mui-focused` 규칙을 같은 구체성으로 다시 건다.
- ⚠ 2026-11-19: 병렬 E2E 가 `test-results/` 를 서로 지웠다 → outputDir 을 포트별로.
- ⚠ 2026-11-19: `next dev` 가 tsconfig 를 재포맷하고 `.next-wN/types` include 를 추가한다 → 커밋 전에 되돌린다.
- ⚠ 2026-11-19(qa1): MuiButton `sizeSmall` 이 root 의 xs 44 를 덮어 xs 작은 버튼이 33 이었다 → sizeSmall 에도 xs 44.
- ⚠ 2026-11-19(qa1): 리플을 끄면 버튼 키보드 포커스 표시가 사라진다 → MuiButtonBase `.Mui-focusVisible` outline.
- ⚠ 2026-11-19(qa1): MUI select 는 FormField `<label htmlFor>` 로 이름이 안 붙는다 → `labelId` + `SelectDisplayProps['aria-labelledby']`.
- ⚠ 2026-11-19(qa1): Dialog 에 aria-labelledby 를 주면 DialogTitle 이 같은 id 를 받아 닫기 버튼까지 이름에 섞였다 → DialogTitle 에 별도 id.
- ⚠ 2026-11-19(qa1): React autoFocus 는 링크(a)에 동작하지 않는다 → 드로어 첫 메뉴는 마운트 뒤 focus().
<!-- END:design-rules -->
