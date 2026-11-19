# SAM 의정부 관리자 대시보드

아마추어 극단 Stage And Me 의정부 관리자 화면(공연·반·단원·신청서·갤러리·일정·연출진·팝업). Next.js 16 + MUI 9. 규칙은 [AGENTS.md](./AGENTS.md).

## 바로 실행

```bash
pnpm install
cp .env.example .env.local      # API_BASE_URL 에 서버 주소, 또는 아래 목 실행
pnpm dev                        # http://localhost:3220 (API_BASE_URL 필요)

# 서버 없이(메모리 목 백엔드 — 데이터는 빈 상태로 시작)
MOCK_BACKEND=true MOCK_ADMIN_USERNAME=<아이디> MOCK_ADMIN_PASSWORD=<비밀번호> pnpm dev
```

## 검증

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build
pnpm exec playwright install chromium     # 처음 한 번
pnpm test:e2e --project=setup --project=desktop --project=mobile
pnpm exec playwright test --project=setup --project=capture   # 화면 캡처(output/sam-uijeongbu/front-end-screens/dashboard)
```

## 배포(Vercel)

- Framework Next.js, Root `/`. 환경변수 `API_BASE_URL`(서버 배포 URL), `IMAGE_HOST`. `MOCK_BACKEND` 는 넣지 않는다(Vercel 에서는 부팅 시 오류).
- Vercel 에서는 `VERCEL` 환경변수로 standalone 출력을 끈다(next.config.ts). Docker 는 `Dockerfile`(standalone).
