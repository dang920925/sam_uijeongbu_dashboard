// ----------------------------------------------------------------------
// 월 조회(리드 공용 fetchScheduleMonth·scheduleKeys.month)를 화면 수용 기준으로 확인한다 — U-5·U-8.
// fetch 는 mock 한다.
// ----------------------------------------------------------------------
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ROOT_KEYS } from '@/src/api/root-keys';
import { fetchScheduleMonth } from '@/src/api/schedule';
import { scheduleKeys } from '@/src/api/schedule-queries';

function page(items: { id: string }[], pageNo: number, totalPages: number) {
  return new Response(
    JSON.stringify({
      items: items.map((item) => ({
        ...item,
        title: `fixture-u23-${item.id}`,
        type: 'PRACTICE',
        startAt: '2026-12-03T11:00:00.000Z',
        endAt: null,
        location: null,
        description: null,
        classId: null,
        performanceId: null,
        status: 'ACTIVE',
        cancelReason: null,
        observationClosed: null,
      })),
      page: pageNo,
      size: 100,
      totalItems: 101,
      totalPages,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}

describe('월 조회', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('totalPages = 2 면 두 쪽을 이어 받아 합친다(U-5)', async () => {
    // Arrange
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(page([{ id: 'a' }], 1, 2))
      .mockResolvedValueOnce(page([{ id: 'b' }], 2, 2));
    vi.stubGlobal('fetch', fetchMock);
    // Act
    const items = await fetchScheduleMonth({ year: 2026, month: 12 });
    // Assert
    expect(items.map((i) => i.id)).toEqual(['a', 'b']);
    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls[0]).toContain('year=2026');
    expect(urls[0]).toContain('month=12');
    expect(urls[1]).toContain('page=2');
  });

  it('월 쿼리 키는 ROOT_KEYS.schedule 로 시작한다(U-8)', () => {
    const key = scheduleKeys.month(2026, 12, 'SHOW');
    expect(key.slice(0, ROOT_KEYS.schedule.length)).toEqual([
      ...ROOT_KEYS.schedule,
    ]);
  });
});
