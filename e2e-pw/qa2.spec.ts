// ----------------------------------------------------------------------
// qa2 수정 요청 재발 방지(qa2.md §10 dashboard) — QA2-003·004·006·008, QA1-022 잔여.
// 목 백엔드 기준. 픽스처 접두사 fixture-qa2-.
// ----------------------------------------------------------------------
import { expect, test } from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const P = 'fixture-qa2-';

test.describe('qa2 수정 확인', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('QA2-003 없는 공연 상세는 여러 번 열어도 404 화면만 보이고 오류 스낵바가 뜨지 않는다', async ({
    page,
  }) => {
    for (let i = 0; i < 5; i += 1) {
      await page.goto('/performances/00000000-0000-7000-8000-00000000abcd');
      await expect(page.getByText('공연을 찾을 수 없습니다')).toBeVisible();
      await page.waitForTimeout(300);
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: '작품 정보를 찾을 수 없습니다.' })
      ).toHaveCount(0);
    }
  });

  test('QA2-004 신청서 탭에 키보드로 포커스하면 링이 탭 안쪽에 그려진다', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, '키보드 포커스는 데스크톱에서 확인');
    await page.goto('/applications');
    const tab = page.getByRole('tab', { name: '🎭 작품 참관' });
    await expect(tab).toBeVisible();
    await tab.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await expect(tab).toBeFocused();
    const style = await tab.evaluate((el) => {
      const s = getComputedStyle(el);
      return { outline: s.outlineStyle, offset: s.outlineOffset };
    });
    expect(style.outline).not.toBe('none');
    expect(style.offset).toBe('-2px');
  });

  test('QA1-022 신청 상세 다이얼로그 이름은 제목만이다', async ({
    page,
    request,
  }) => {
    await request.post('/api/backend/v1/__mock/seed/applications', {
      data: [{ applicantName: `${P}신청`, phone: '010-0000-0000' }],
    });
    await page.goto('/applications');
    await page.getByRole('button', { name: '상세 보기' }).first().click();
    await expect(
      page.getByRole('dialog', { name: '🎭 작품 참관 신청 상세', exact: true })
    ).toBeVisible();
  });

  test('QA2-006 공연 목록에서 행을 키보드로 열면 상세가 그려진 뒤 h1 에 포커스가 간다', async ({
    page,
    request,
    isMobile,
  }) => {
    test.skip(isMobile, '키보드 행 이동은 데스크톱 표에서 확인');
    await adminApi(request, 'POST', '/admin/performances', {
      title: `${P}공연`,
      type: 'PLAY',
      status: 'ONGOING',
    });
    await page.goto('/performances');
    const row = page.getByRole('row').filter({ hasText: `${P}공연` });
    await row.focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('heading', { level: 1, name: `${P}공연` })
    ).toBeFocused();
  });

  test('QA2-008 반 충돌 차단 문구는 상자 없는 글자 한 줄이고 비활성 "추가"는 같은 색 50%', async ({
    page,
    request,
  }) => {
    const perf = await adminApi<{ id: string }>(
      request,
      'POST',
      '/admin/performances',
      {
        title: `${P}공연`,
        type: 'PLAY',
        status: 'ONGOING',
      }
    );
    await adminApi(request, 'POST', `/admin/performances/${perf.id}/classes`, {
      name: `${P}월반`,
      daysOfWeek: ['MON'],
      startTime: '19:00',
      endTime: '21:00',
      status: 'ACTIVE',
    });
    await page.goto(`/performances/${perf.id}`);
    await page.getByRole('button', { name: '반 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '반 추가', exact: true });
    await dialog.getByLabel('반 이름').fill(`${P}새반`);
    await dialog.getByRole('button', { name: '월', exact: true }).click();
    await dialog.getByLabel('시작 시간').fill('20:00');
    await dialog.getByLabel('종료 시간').fill('22:00');
    const block = dialog.getByText(
      '선택한 요일/시간에 이미 다른 반이 있습니다'
    );
    await expect(block).toBeVisible();
    expect(
      await block.evaluate((el) => el.closest('.MuiAlert-root'))
    ).toBeNull();
    const add = dialog.getByRole('button', { name: '추가' });
    await expect(add).toBeDisabled();
    const look = await add.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, opacity: s.opacity };
    });
    expect(look).toEqual({ bg: 'rgb(15, 23, 42)', opacity: '0.5' });
  });
});
