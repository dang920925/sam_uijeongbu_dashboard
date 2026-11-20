import { describe, expect, it } from 'vitest';

import {
  classesErrorSnackbar,
  detailErrorSnackbar,
} from '@/src/sections/performance-detail/utils/detail-error-snackbar';

const MSG = '작품 정보를 찾을 수 없습니다.';

describe('detail-error-snackbar', () => {
  it('반 조회가 먼저 실패해 상세가 아직 loading 이면 반 오류 스낵바를 띄우지 않는다(QA2-003)', () => {
    expect(classesErrorSnackbar('loading', MSG)).toBeNull();
  });

  it('상세가 404·오류면 반 오류 스낵바를 띄우지 않고, 상세가 ready 일 때만 띄운다', () => {
    expect(classesErrorSnackbar('not-found', MSG)).toBeNull();
    expect(classesErrorSnackbar('error', MSG)).toBeNull();
    expect(classesErrorSnackbar('ready', MSG)).toBe(MSG);
  });

  it('상세 404 는 스낵바 없이 전용 화면, 그 밖 상세 오류만 스낵바', () => {
    expect(detailErrorSnackbar('not-found', MSG)).toBeNull();
    expect(detailErrorSnackbar('error', '서버 오류')).toBe('서버 오류');
  });
});
