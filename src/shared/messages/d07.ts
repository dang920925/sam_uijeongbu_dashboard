// ----------------------------------------------------------------------
// SCR-D07 갤러리 문구(MSG-D07-*). 근거: 현행 Gallery.tsx(파일:줄) · design SCR-D07 · designer.md §3.3 SCR-D07.
// 카테고리 라벨은 코드값 맵(GALLERY_CATEGORY_LABEL, develop §3.1)을 쓴다.
// ----------------------------------------------------------------------
export const MSG_D07 = {
  /** Gallery.tsx:78-79 */
  TITLE: '갤러리',
  SUBTITLE: '공연 및 활동 사진을 관리합니다',
  /** Gallery.tsx:85 */
  UPLOAD_TITLE: '이미지 업로드',
  /** Gallery.tsx:88 */
  CATEGORY: '카테고리',
  /** Gallery.tsx:100,102 */
  DESCRIPTION: '설명 (선택)',
  DESCRIPTION_PH: '사진 설명 입력',
  /** Gallery.tsx:126 — 업로드·등록 실패(UPL_001·002 사전 검사 실패는 계약 문구 MSG_UPLOAD 로 대신 보인다) */
  UPLOAD_FAILED: '업로드 중 오류가 발생했습니다',
  /** Gallery.tsx:140 — 필터 pill */
  FILTER_ALL: '전체',
  /** 필터 묶음 aria-label — 업로드 카드의 라벨 "카테고리"(Gallery.tsx:88)를 재사용(자체 결정) */
  FILTER_ARIA: '카테고리',
  /** Gallery.tsx:163 */
  EMPTY: '등록된 이미지가 없습니다',
  /** Gallery.tsx:171 — 설명·카테고리 모두 없을 때 대체 텍스트 */
  IMAGE_ALT_FALLBACK: '갤러리 이미지',
  /** Gallery.tsx:189 */
  DELETE_CONFIRM: '이미지를 삭제하시겠습니까?',
  /** 그리드 목록 aria-label — 페이지 제목 "갤러리" 재사용(자체 결정) */
  GRID_ARIA: '갤러리',
} as const;
