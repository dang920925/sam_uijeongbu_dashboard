// Vitest 전역 설정 — 시간대를 KST 와 다른 UTC 로 고정해, 날짜 유틸이 실행 환경 TZ 에 기대지 않는지 검사한다.
process.env.TZ = 'UTC';
