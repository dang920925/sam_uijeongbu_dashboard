// ----------------------------------------------------------------------
// 공연 폼 문구(MSG-PERF-FORM-*) — SCR-D03 "공연 추가"·SCR-D04 "공연 수정" 공용.
// 근거: 현행 Performances.tsx:27,157-197 / D5 칸 라벨 design SCR-D03 [D5]("포스터 이미지"·"상세 이미지"·"홈페이지 노출").
// ----------------------------------------------------------------------
export const MSG_PERF_FORM = {
  ADD_TITLE: '공연 추가',
  EDIT_TITLE: '공연 수정',
  TITLE: '공연 제목',
  TITLE_PH: '공연 제목 입력',
  TITLE_REQUIRED: '공연 제목을 입력해주세요',
  TYPE: '타입',
  STATUS: '상태',
  DESCRIPTION: '설명',
  DESCRIPTION_PH: '공연 설명 입력',
  POSTER: '포스터 이미지',
  DETAIL_IMAGES: '상세 이미지',
  /** 생성 실패 — 현행 Performances.tsx:188 */
  CREATE_FAILED: '공연 생성 중 오류가 발생했습니다',
} as const;
