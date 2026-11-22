import { describe, expect, it } from 'vitest';

import {
  changeAppType,
  DEFAULT_APPLICATION_FILTERS,
  hasActiveFilter,
  nextSort,
  toApplicationListQuery,
  toAriaSort,
  toProgressFilterOptions,
  toWorkFilterOptions,
} from '@/src/sections/applications/utils/application-filters';

describe('application-filters', () => {
  it('기본 필터는 "전체"를 빼고 접수일 내림차순만 보낸다', () => {
    // Act
    const query = toApplicationListQuery(DEFAULT_APPLICATION_FILTERS, 1, 20);
    // Assert
    expect(query).toEqual({
      appType: undefined,
      status: undefined,
      performanceId: undefined,
      contacted: undefined,
      progress: undefined,
      sort: 'createdAt',
      order: 'desc',
      page: 1,
      size: 20,
    });
  });

  it('필터 조합을 쿼리로 바꾸고 연락 전은 contacted=false 다', () => {
    // Act
    const query = toApplicationListQuery(
      {
        appType: 'CONSULTATION',
        performanceId: 'p1',
        contact: 'UNCONTACTED',
        progress: 'SCHEDULED',
        sort: 'contactedAt',
        order: 'asc',
      },
      2,
      20
    );
    // Assert
    expect(query).toEqual({
      appType: 'CONSULTATION',
      performanceId: 'p1',
      contacted: false,
      progress: 'SCHEDULED',
      sort: 'contactedAt',
      order: 'asc',
      page: 2,
      size: 20,
    });
    expect(
      toApplicationListQuery(
        { ...DEFAULT_APPLICATION_FILTERS, contact: 'CONTACTED' },
        1,
        20
      ).contacted
    ).toBe(true);
  });

  it('정렬 외 필터가 걸렸는지 안다', () => {
    expect(hasActiveFilter(DEFAULT_APPLICATION_FILTERS)).toBe(false);
    expect(
      hasActiveFilter({ ...DEFAULT_APPLICATION_FILTERS, sort: 'progress' })
    ).toBe(false);
    expect(
      hasActiveFilter({ ...DEFAULT_APPLICATION_FILTERS, contact: 'CONTACTED' })
    ).toBe(true);
  });

  it('진행 필터 항목은 유형별 이름이고 전체면 두 유형 이름을 묶는다', () => {
    expect(
      toProgressFilterOptions('WORK_OBSERVATION').map((o) => o.label)
    ).toEqual(['접수', '일정 확정', '참관 완료', '불참']);
    expect(toProgressFilterOptions('ALL').map((o) => o.label)).toEqual([
      '접수',
      '일정 확정·상담 예정',
      '참관 완료·상담 완료',
      '입단',
      '불참·보류',
    ]);
  });

  it('참관으로 바꾸면 입단 필터는 전체로 돌아가고 다른 단계는 남는다', () => {
    const joined = {
      ...DEFAULT_APPLICATION_FILTERS,
      progress: 'JOINED' as const,
    };
    expect(changeAppType(joined, 'WORK_OBSERVATION').progress).toBe('ALL');
    const scheduled = {
      ...DEFAULT_APPLICATION_FILTERS,
      progress: 'SCHEDULED' as const,
    };
    expect(changeAppType(scheduled, 'WORK_OBSERVATION')).toMatchObject({
      appType: 'WORK_OBSERVATION',
      progress: 'SCHEDULED',
    });
  });

  it('같은 열 머리는 방향만 뒤집고 다른 열은 내림차순부터다', () => {
    // Act
    const flipped = nextSort(DEFAULT_APPLICATION_FILTERS, 'createdAt');
    const other = nextSort(flipped, 'progress');
    // Assert
    expect([flipped.sort, flipped.order]).toEqual(['createdAt', 'asc']);
    expect([other.sort, other.order]).toEqual(['progress', 'desc']);
    expect(toAriaSort(flipped, 'createdAt')).toBe('ascending');
    expect(toAriaSort(other, 'progress')).toBe('descending');
    expect(toAriaSort(other, 'createdAt')).toBe('none');
  });

  it('작품 필터 항목은 제목순(한국어 정렬 — 한글 먼저)이다', () => {
    expect(
      toWorkFilterOptions([
        { id: 'b', title: 'HADESTOWN' },
        { id: 'c', title: '안내놔? 못내놔!' },
        { id: 'a', title: 'Dear' },
      ]).map((o) => o.value)
    ).toEqual(['c', 'a', 'b']);
  });
});
