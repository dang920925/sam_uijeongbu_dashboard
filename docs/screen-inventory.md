# 화면 인벤토리 (대시보드)

| SCR | 화면 | 경로 | 섹션 | 형식 | 형식별 정본 |
| --- | --- | --- | --- | --- | --- |
| SCR-D00 | 공용 틀 | (전체) | `src/layouts/admin` | 사이드바·레일·드로어 | — |
| SCR-D01 | 로그인 | `/login` | `src/sections/login` | 중앙 카드 폼 | 단일 폼 정본 |
| SCR-D02 | 요약 | `/` | `src/sections/dashboard` | 현황판(KPI) — 대기 신청서 설명 줄 "연락 전 n건"(U31) | 현황판 정본 |
| SCR-D03 | 공연 관리 | `/performances` | `src/sections/performance-list` | 테이블 → xs 카드 + Dialog | **테이블 정본** |
| SCR-D04 | 공연 상세·반 | `/performances/[id]` | `src/sections/performance-detail` | 상세 카드 + 테이블 (+ R1 탭 머리 `performance-detail-head`, U48 머리 [홈페이지 미리보기]) | 상세 정본 |
| SCR-D05 | 단원 관리 | `/members` | `src/sections/members` | 테이블(U39 공개 동의일 열) + 상세 패널(lg)/시트 | 마스터·디테일 정본 |
| SCR-D06 | 신청서 관리 | `/applications` | `src/sections/applications` | 유형 pill + 한 행 표(lg 7열 · md 5열 — U39 처리 상태 열 제거, MUI Table 직접 — DataTable 에 열 숨김 없음) / xs 카드 + 상세 드로어(lg 비모달 440 · xs 전체 화면) — U31 보강·U29 | 열 많은 표(lg 전환) 정본 |
| SCR-D07 | 갤러리 | `/gallery` | `src/sections/gallery` | 카드 그리드 2/3/4/5 | 카드 그리드 정본 |
| SCR-D08 | 일정 관리 | `/schedules` | `src/sections/schedules` | 월(6×7 칩)·주(시간 격자)·목록(테이블 lg / 카드) + 상세 팝오버(xs 시트) + Dialog, xs 월 = 아젠다 — U23 보강·U29 취소 | 달력 정본 |
| SCR-D09 | 연출진 관리 | `/staff` | `src/sections/staff` | 테이블 / xs 카드 + Dialog | — |
| SCR-D10 | 팝업 관리 | `/popups` | `src/sections/popups` | 테이블(lg) / 카드 + Dialog | — |
| SCR-D11 | 회차·예매 설정(R1) | `/performances/[id]/shows` | `src/sections/performance-shows` | 공연 상세 탭 · 설정 카드(폼) + 가격 등급 표 + 회차 표(lg)/카드(U48 출연 팀 선택 열) + Dialog | — |
| SCR-D14 | 배역·캐스팅(R3·U45·U48) | `/performances/[id]/cast` | `src/sections/performance-cast` | 공연 상세 탭 · 공개 스위치 · 배역 · 팀 구성 표 · U48 캐스트 사진 카드(U51 배역 카드 비율 선택 · 단체샷·팀샷 16:9 그리드(고른 비율로 잘라 보기) + 배역 블록 × 배우 줄(카드 비율 · 저장된 위치)) · U51 '보이는 위치 조정' 창(lg 960 / xs 전체 화면) · 회차 격자 · 참여자 + Dialog | 사진 슬롯(올리기·교체·삭제·실패) 정본 · 크롭 편집기(`photo-crop-dialog`) 정본 |
| SCR-D12 | 예매 관리(R1) | `/reservations` | `src/sections/reservations` | KPI 4 + 탭(예매·집계·초대 링크) · 표(lg)/카드 + 상세 드로어 | — |
| SCR-D13 | 입장 체크(R1) | `/admission` | `src/sections/admission` | 휴대폰 우선 리스트(현황·검색 고정, 터치 48) · md 2열 · lg 표 + 현황 패널 | 현장 리스트 정본 |
| SCR-D15 | 계정 설정(R1) | `/account` | `src/sections/account` | 전체 페이지 폼(카드 1, 최대 480) + U37 예매 알림 카드(토글·기기 목록·시험 알림·iOS 안내) | — |
| — | 헤더 예매번호로 찾기(R1) | (전체 헤더) | `src/layouts/admin/quick-search` | 검색 + 결과 목록 + 상세 드로어 | — |
| — | 404·오류 | `not-found`·`error`·`global-error` | `src/sections/app-state` | 상태 화면 | — |
