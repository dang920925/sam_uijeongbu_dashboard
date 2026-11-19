# 화면 인벤토리 (대시보드)

| SCR | 화면 | 경로 | 섹션 | 형식 | 형식별 정본 |
| --- | --- | --- | --- | --- | --- |
| SCR-D00 | 공용 틀 | (전체) | `src/layouts/admin` | 사이드바·레일·드로어 | — |
| SCR-D01 | 로그인 | `/login` | `src/sections/login` | 중앙 카드 폼 | 단일 폼 정본 |
| SCR-D02 | 요약 | `/` | `src/sections/dashboard` | 현황판(KPI) | 현황판 정본 |
| SCR-D03 | 공연 관리 | `/performances` | `src/sections/performance-list` | 테이블 → xs 카드 + Dialog | **테이블 정본** |
| SCR-D04 | 공연 상세·반 | `/performances/[id]` | `src/sections/performance-detail` | 상세 카드 + 테이블 | 상세 정본 |
| SCR-D05 | 단원 관리 | `/members` | `src/sections/members` | 테이블 + 상세 패널(lg)/시트 | 마스터·디테일 정본 |
| SCR-D06 | 신청서 관리 | `/applications` | `src/sections/applications` | 탭 + 테이블(lg) / 카드 | 열 많은 표(lg 전환) 정본 |
| SCR-D07 | 갤러리 | `/gallery` | `src/sections/gallery` | 카드 그리드 2/3/4/5 | 카드 그리드 정본 |
| SCR-D08 | 일정 관리 | `/schedules` | `src/sections/schedules` | 테이블(lg) / 카드 + Dialog | — |
| SCR-D09 | 연출진 관리 | `/staff` | `src/sections/staff` | 테이블 / xs 카드 + Dialog | — |
| SCR-D10 | 팝업 관리 | `/popups` | `src/sections/popups` | 테이블(lg) / 카드 + Dialog | — |
| — | 404·오류 | `not-found`·`error`·`global-error` | `src/sections/app-state` | 상태 화면 | — |
