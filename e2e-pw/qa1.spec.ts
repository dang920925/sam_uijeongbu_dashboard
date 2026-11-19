// ----------------------------------------------------------------------
// qa1 수정 요청 재발 방지(qa1.md §10.4 dashboard) — QA1-007·009·010·012·013·014·022·023·025·026.
// 목 백엔드 기준. 픽스처 접두사 fixture-qa1-.
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import {
  adminApi,
  resetMock,
  uploadFixtureImage,
} from '@/e2e-pw/support/mock-api';

const P = 'fixture-qa1-';

function entryOf(page: Page, isMobile: boolean, text: string) {
  return isMobile
    ? page.getByRole('listitem').filter({ hasText: text })
    : page.getByRole('row').filter({ hasText: text });
}

test.describe('qa1 수정 확인', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('QA1-009 키보드로 버튼에 포커스하면 포커스 링이 보인다', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, '키보드 포커스는 데스크톱에서 확인');
    await page.goto('/performances');
    const button = page.getByRole('button', { name: '공연 추가' });
    await expect(button).toBeVisible();
    await button.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    const outline = await button.evaluate(
      (el) => getComputedStyle(el).outlineStyle
    );
    expect(outline).not.toBe('none');
  });

  test('QA1-010·022·014 반 "상태" select 이름, 다이얼로그 이름 = 제목, 충돌 시 하단 차단 문구', async ({
    page,
    request,
  }) => {
    const other = await adminApi<{ id: string }>(
      request,
      'POST',
      '/admin/performances',
      {
        title: `${P}다른공연`,
        type: 'PLAY',
        status: 'ONGOING',
      }
    );
    await adminApi(request, 'POST', `/admin/performances/${other.id}/classes`, {
      name: `${P}월반`,
      daysOfWeek: ['MON'],
      startTime: '19:00',
      endTime: '21:00',
      status: 'ACTIVE',
    });
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
    await page.goto(`/performances/${perf.id}`);
    await page.getByRole('button', { name: '반 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '반 추가', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: '상태' })).toBeVisible();
    await dialog.getByLabel('반 이름').fill(`${P}새반`);
    await dialog.getByRole('button', { name: '월', exact: true }).click();
    await dialog.getByLabel('시작 시간').fill('20:00');
    await dialog.getByLabel('종료 시간').fill('22:00');
    await expect(
      dialog.getByText('선택한 요일/시간에 이미 다른 반이 있습니다')
    ).toBeVisible();
    await expect(dialog.getByRole('button', { name: '추가' })).toBeDisabled();
  });

  test('QA1-010·007 갤러리 "카테고리" select 이름, xs 타일 "삭제" 높이 44', async ({
    page,
    request,
    isMobile,
  }) => {
    await adminApi(request, 'POST', '/admin/galleries', {
      imageUrl: await uploadFixtureImage(request, 'GALLERY'),
      category: 'PERFORMANCE',
      description: `${P}사진`,
    });
    await page.goto('/gallery');
    await expect(
      page.getByRole('combobox', { name: '카테고리' })
    ).toBeVisible();
    if (isMobile) {
      const del = page.getByRole('button', { name: '삭제' }).first();
      const box = await del.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });

  test('QA1-012 이미 지워진 연출진을 삭제하면 문구를 보이고 행이 사라진다', async ({
    page,
    request,
    isMobile,
  }) => {
    const staff = await adminApi<{ id: string }>(
      request,
      'POST',
      '/admin/staff',
      {
        name: `${P}연출`,
        role: `${P}역할`,
      }
    );
    await page.goto('/staff');
    await expect(entryOf(page, isMobile, `${P}연출`)).toBeVisible();
    await adminApi(request, 'DELETE', `/admin/staff/${staff.id}`);
    await entryOf(page, isMobile, `${P}연출`)
      .getByRole('button', { name: '연출진 삭제' })
      .click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '삭제' })
      .click();
    await expect(
      page.getByText('연출진 정보를 찾을 수 없습니다.')
    ).toBeVisible();
    await expect(entryOf(page, isMobile, `${P}연출`)).toHaveCount(0);
  });

  test('QA1-012 이미 지워진 단원을 패널에서 삭제하면 패널이 닫히고 목록에서 사라진다', async ({
    page,
    request,
  }) => {
    const member = await adminApi<{ id: string }>(
      request,
      'POST',
      '/admin/members',
      {
        name: `${P}단원`,
        type: 'GENERAL',
      }
    );
    await page.goto(`/members?member=${member.id}`);
    await expect(page.getByRole('button', { name: '단원 삭제' })).toBeVisible();
    await adminApi(request, 'DELETE', `/admin/members/${member.id}`);
    await page.getByRole('button', { name: '단원 삭제' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '삭제' })
      .click();
    await expect(
      page.getByText('단원 정보를 찾을 수 없습니다.').first()
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '단원 삭제' })).toHaveCount(
      0
    );
    await expect(page).not.toHaveURL(/member=/);
  });

  test('QA1-023 형식이 틀린 단원 id 는 "단원 정보를 찾을 수 없습니다." 로 보인다', async ({
    page,
  }) => {
    await page.goto('/members?member=not-a-uuid');
    await expect(
      page.getByText('단원 정보를 찾을 수 없습니다.').first()
    ).toBeVisible();
    await expect(page.getByText('id 형식이 올바르지 않습니다.')).toHaveCount(0);
  });

  test('QA1-013 삭제된 공연에 연결된 일정은 수정 다이얼로그에서 "선택 안 함"이고 저장된다', async ({
    page,
    request,
    isMobile,
  }) => {
    const perf = await adminApi<{ id: string }>(
      request,
      'POST',
      '/admin/performances',
      {
        title: `${P}지울공연`,
        type: 'PLAY',
        status: 'ONGOING',
      }
    );
    await adminApi(request, 'POST', '/admin/schedules', {
      title: `${P}일정`,
      type: 'SHOW',
      startAt: '2026-12-01T19:00:00+09:00',
      performanceId: perf.id,
    });
    await adminApi(request, 'DELETE', `/admin/performances/${perf.id}`);
    await page.goto('/schedules');
    await entryOf(page, isMobile, `${P}일정`)
      .getByRole('button', { name: '일정 수정' })
      .click();
    const dialog = page.getByRole('dialog', { name: '일정 수정' });
    await expect(
      dialog.getByRole('combobox', { name: '연결 공연' })
    ).toContainText('선택 안 함');
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText('저장되었습니다')).toBeVisible();
  });

  test('QA1-026 다른 곳에서 먼저 거절된 신청을 상세에서 승인하면 상세도 거절로 바뀐다', async ({
    page,
    request,
  }) => {
    const seeded = await request.post(
      '/api/backend/v1/__mock/seed/applications',
      {
        data: [{ applicantName: `${P}신청`, phone: '010-0000-0000' }],
      }
    );
    const { items } = (await seeded.json()) as { items: { id: string }[] };
    await page.goto('/applications');
    await page.getByRole('button', { name: '상세 보기' }).first().click();
    const detail = page.getByRole('dialog', { name: '🎭 작품 참관 신청 상세' });
    await expect(detail.getByRole('button', { name: '승인' })).toBeVisible();
    await adminApi(
      request,
      'POST',
      `/admin/applications/${items[0].id}/reject`
    );
    await detail.getByRole('button', { name: '승인' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '승인' })
      .click();
    await expect(page.getByText('이미 처리된 신청입니다.')).toBeVisible();
    await expect(detail.getByRole('button', { name: '승인' })).toHaveCount(0);
    await expect(
      detail.getByText('거절', { exact: true }).first()
    ).toBeVisible();
  });

  test('QA1-025 xs 드로어를 열면 첫 메뉴에 포커스가 간다', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'xs 드로어는 모바일에서 확인');
    await page.goto('/');
    await page.getByRole('button', { name: '메뉴 열기' }).click();
    await expect(
      page.getByRole('link', { name: '대시보드' }).last()
    ).toBeFocused();
  });
});
