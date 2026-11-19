import { describe, expect, it } from 'vitest';

import {
  fromClassItemResponse,
  fromPerformanceResponse,
  toClassFormInput,
  toClassUpsertRequest,
  toPerformanceFormInput,
  toPerformanceUpsertRequest,
} from '@/src/api/performance-mapper';
import type { AdminPerformanceResponse } from '@/src/types/performance';

const RESPONSE: AdminPerformanceResponse = {
  id: 'p1',
  title: 'fixture-공연',
  type: 'PLAY',
  status: 'UPCOMING',
  isVisible: true,
  posterImageUrl: null,
  createdAt: '2026-11-19T01:00:00.000Z',
  description: null,
  detailImageUrls: [],
  updatedAt: '2026-11-19T01:00:00.000Z',
};

describe('performance-mapper', () => {
  it('상세 응답을 화면 모델로 매핑하고 상세 이미지는 항상 배열로 둔다', () => {
    // Arrange
    const res = {
      ...RESPONSE,
      detailImageUrls: undefined as unknown as string[],
    };
    // Act
    const model = fromPerformanceResponse(res);
    // Assert
    expect(model.detailImageUrls).toEqual([]);
    expect(model.title).toBe('fixture-공연');
  });

  it('폼 입력의 빈 설명은 null, 제목은 앞뒤 공백을 지워 요청 바디로 만든다', () => {
    // Arrange
    const input = {
      ...toPerformanceFormInput(fromPerformanceResponse(RESPONSE)),
      title: '  제목 ',
      description: '   ',
    };
    // Act
    const request = toPerformanceUpsertRequest(input);
    // Assert
    expect(request).toEqual({
      title: '제목',
      type: 'PLAY',
      status: 'UPCOMING',
      description: null,
      posterImageUrl: null,
      detailImageUrls: [],
      isVisible: true,
    });
  });

  it('반 폼의 빈 시간·마감일·장소를 null 로 보낸다', () => {
    // Act
    const request = toClassUpsertRequest({
      name: ' A반 ',
      daysOfWeek: ['MON', 'WED'],
      startTime: '19:00',
      endTime: '',
      deadline: '',
      location: '',
      status: 'ACTIVE',
    });
    // Assert
    expect(request).toEqual({
      name: 'A반',
      daysOfWeek: ['MON', 'WED'],
      startTime: '19:00',
      endTime: null,
      deadline: null,
      location: null,
      status: 'ACTIVE',
    });
  });

  it('반 응답을 수정 폼 초기값으로 되돌릴 때 null 은 빈 문자열이 된다', () => {
    // Arrange
    const item = fromClassItemResponse({
      id: 'c1',
      performanceId: 'p1',
      name: 'A반',
      daysOfWeek: ['FRI'],
      startTime: null,
      endTime: null,
      deadline: null,
      location: null,
      status: 'INACTIVE',
      createdAt: '2026-11-19T01:00:00.000Z',
    });
    // Act
    const form = toClassFormInput(item);
    // Assert
    expect(form).toMatchObject({
      startTime: '',
      endTime: '',
      deadline: '',
      location: '',
      status: 'INACTIVE',
    });
  });
});
