// ----------------------------------------------------------------------
// SCR-D06 신청서 관리(FN-13, 사용자 결정 2026-11-19 D6 "승인과 등록 분리") — 수용 기준을 화면·API 로 확인한다.
// 신청은 홈페이지가 만들므로 목 시드(`/__mock/seed/applications`)로 넣는다. 픽스처 접두사 fixture-1-w3-.
// desktop(lg 표 · 아이콘 버튼)·mobile(카드 · 글자 버튼) 모두 버튼 접근 이름이 같아 같은 흐름으로 돈다.
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const API = '/api/backend/v1';
const NAME = 'fixture-1-w3-신청자';

interface SeedApplication {
  appType?: 'WORK_OBSERVATION' | 'CONSULTATION';
  applicantName?: string;
  phone?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  performance?: { id: string; title: string } | null;
  preferredDate?: string | null;
  consultationMethod?: string | null;
  preferredTime?: string | null;
  motivation?: string | null;
  age?: number | null;
  createdAt?: string;
}

interface SeededItem {
  id: string;
  member: { id: string; name: string } | null;
}

async function seed(
  request: APIRequestContext,
  items: SeedApplication[]
): Promise<SeededItem[]> {
  const response = await request.post(`${API}/__mock/seed/applications`, {
    data: items.map((item) => ({
      applicantName: NAME,
      phone: '010-1234-5678',
      ...item,
    })),
  });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { items: SeededItem[] }).items;
}

async function memberCount(request: APIRequestContext): Promise<number> {
  const res = await adminApi<{ totalCount: number }>(
    request,
    'GET',
    '/admin/members'
  );
  return res.totalCount;
}

function confirmDialog(page: Page) {
  return page.getByRole('alertdialog');
}

test.describe('SCR-D06 신청서 관리', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('신청이 없으면 탭별 빈 문구를 보여 준다', async ({ page }) => {
    await page.goto('/applications');
    await expect(
      page.getByRole('heading', { level: 1, name: '참관 신청 관리' })
    ).toBeVisible();
    await expect(page.getByText('참관 신청이 없습니다')).toBeVisible();
    await page.getByRole('tab', { name: '💬 방문 상담' }).click();
    await expect(page.getByText('방문 상담 신청이 없습니다')).toBeVisible();
    await expect(page.getByText(/^미처리/)).toHaveCount(0);
  });

  test('참관 승인은 단원을 만들지 않고 행에 "단원으로 등록" 버튼이 생긴다', async ({
    page,
    request,
  }) => {
    await seed(request, [
      {
        performance: { id: 'p1', title: 'fixture-1-w3-공연' },
        preferredDate: '2026-12-01',
        age: 20,
      },
    ]);
    await page.goto('/applications');
    await expect(page.getByText('미처리 1건')).toBeVisible();
    await expect(page.getByText('총 1건')).toBeVisible();
    await expect(
      page.getByText('2026.12.01').filter({ visible: true }).first()
    ).toBeVisible();

    await page.getByRole('button', { name: '승인', exact: true }).click();
    await expect(confirmDialog(page)).toContainText(
      `${NAME}님의 신청을 승인하시겠습니까?`
    );
    await confirmDialog(page).getByRole('button', { name: '승인' }).click();

    await expect(
      page.getByRole('button', { name: '단원으로 등록' })
    ).toBeVisible();
    await expect(page.getByText(/^미처리/)).toHaveCount(0);
    expect(await memberCount(request)).toBe(0);
  });

  test('상담 승인도 단원을 만들지 않고 승인 응답에 member 가 없다', async ({
    page,
    request,
  }) => {
    const [, second] = await seed(request, [
      {
        appType: 'CONSULTATION',
        consultationMethod: 'PHONE',
        preferredTime: 'WEEKDAY_EVENING',
      },
      { appType: 'CONSULTATION', applicantName: 'fixture-1-w3-API신청자' },
    ]);
    // API 수준: 승인 응답은 { application } 만(develop §3.4 "단원 생성 없음")
    const approved = await adminApi<Record<string, unknown>>(
      request,
      'POST',
      `/admin/applications/${second.id}/approve`
    );
    expect(Object.keys(approved)).toEqual(['application']);

    await page.goto('/applications');
    await page.getByRole('tab', { name: '💬 방문 상담' }).click();
    await expect(
      page.getByText('평일 저녁 (18~21시)').filter({ visible: true }).first()
    ).toBeVisible();
    await page.getByRole('button', { name: '승인', exact: true }).click();
    await confirmDialog(page).getByRole('button', { name: '승인' }).click();
    await expect(
      page.getByRole('button', { name: '단원으로 등록' })
    ).toHaveCount(2);
    expect(await memberCount(request)).toBe(0);
  });

  test('대기 신청에 단원 등록을 요청하면 409 APP_009', async ({ request }) => {
    const [pending] = await seed(request, [{}]);
    const response = await request.post(
      `${API}/admin/applications/${pending.id}/member`,
      { data: { name: NAME, phone: null, type: 'GENERAL' } }
    );
    expect(response.status()).toBe(409);
    expect(await response.json()).toMatchObject({
      code: 'APP_009',
      message: '승인된 신청만 단원으로 등록할 수 있습니다.',
    });
  });

  test('승인된 신청을 단원으로 등록하면 행에 "단원 등록됨", 상세에 단원 이름 링크가 생긴다', async ({
    page,
    request,
  }) => {
    await seed(request, [{ status: 'APPROVED' }]);
    await page.goto('/applications');
    await page.getByRole('button', { name: '단원으로 등록' }).click();

    const dialog = page.getByRole('dialog', { name: '단원으로 등록' });
    await expect(dialog.getByLabel('이름')).toHaveValue(NAME);
    await expect(dialog.getByLabel('연락처')).toHaveValue('010-1234-5678');
    await dialog.getByLabel('이름').fill('fixture-1-w3-새단원');
    await dialog.getByRole('button', { name: '등록' }).click();

    await expect(page.getByText('단원으로 등록되었습니다.')).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByText('단원 등록됨').filter({ visible: true })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '단원으로 등록' })
    ).toHaveCount(0);
    expect(await memberCount(request)).toBe(1);

    await page.getByRole('button', { name: '상세 보기' }).click();
    const detail = page.getByRole('dialog', { name: '🎭 작품 참관 신청 상세' });
    const link = detail.getByRole('link', { name: 'fixture-1-w3-새단원' });
    await expect(link).toBeVisible();
    const members = await adminApi<{ items: { id: string }[] }>(
      request,
      'GET',
      '/admin/members'
    );
    await expect(link).toHaveAttribute(
      'href',
      `/members?member=${members.items[0].id}`
    );
  });

  test('이미 등록된 신청을 다시 등록하면 APP_008 문구 스낵바, 등록 다이얼로그는 열려 있다', async ({
    page,
    request,
  }) => {
    const [approved] = await seed(request, [{ status: 'APPROVED' }]);
    await page.goto('/applications');
    await page.getByRole('button', { name: '단원으로 등록' }).click();
    const dialog = page.getByRole('dialog', { name: '단원으로 등록' });
    await expect(dialog).toBeVisible();
    // 다른 관리자가 먼저 등록한 상황
    await adminApi(
      request,
      'POST',
      `/admin/applications/${approved.id}/member`,
      {
        name: NAME,
        phone: null,
        type: 'GENERAL',
      }
    );
    await dialog.getByRole('button', { name: '등록' }).click();

    await expect(page.getByRole('alert')).toContainText(
      '이미 단원으로 등록된 신청입니다.'
    );
    await expect(dialog).toBeVisible();
    expect(await memberCount(request)).toBe(1);
  });

  test('연결 단원을 삭제하면 같은 신청을 다시 등록할 수 있다', async ({
    page,
    request,
  }) => {
    const [approved] = await seed(request, [{ status: 'APPROVED' }]);
    const first = await adminApi<{ member: { id: string } }>(
      request,
      'POST',
      `/admin/applications/${approved.id}/member`,
      { name: NAME, phone: null, type: 'GENERAL' }
    );
    await adminApi(request, 'DELETE', `/admin/members/${first.member.id}`);

    // 삭제된 단원은 member null → 화면에 다시 "단원으로 등록"
    await page.goto('/applications');
    await expect(page.getByText('단원 등록됨')).toHaveCount(0);
    await page.getByRole('button', { name: '단원으로 등록' }).click();
    await page
      .getByRole('dialog', { name: '단원으로 등록' })
      .getByRole('button', { name: '등록' })
      .click();
    await expect(page.getByText('단원으로 등록되었습니다.')).toBeVisible();
    const detail = await adminApi<{ member: { id: string } | null }>(
      request,
      'GET',
      `/admin/applications/${approved.id}`
    );
    expect(detail.member?.id).not.toBe(first.member.id);
    expect(await memberCount(request)).toBe(1);
  });

  test('거절된 신청을 승인하면 409 APP_007 — 화면은 확인창을 닫고 스낵바', async ({
    page,
    request,
  }) => {
    const [app] = await seed(request, [{}]);
    await page.goto('/applications');
    await expect(page.getByText('미처리 1건')).toBeVisible();
    // 화면을 연 뒤 다른 곳에서 거절됨
    await adminApi(request, 'POST', `/admin/applications/${app.id}/reject`);
    const response = await request.post(
      `${API}/admin/applications/${app.id}/approve`
    );
    expect(response.status()).toBe(409);
    expect((await response.json()).code).toBe('APP_007');

    await page.getByRole('button', { name: '승인', exact: true }).click();
    await confirmDialog(page).getByRole('button', { name: '승인' }).click();
    await expect(page.getByRole('alert')).toContainText(
      '이미 처리된 신청입니다.'
    );
    await expect(confirmDialog(page)).toBeHidden();
  });

  test('상세에서 거절하면 상태가 거절로 바뀌고 하단 동작이 사라진다', async ({
    page,
    request,
  }) => {
    await seed(request, [{ motivation: 'fixture-1-w3-동기', age: 31 }]);
    await page.goto('/applications');
    await page.getByRole('button', { name: '상세 보기' }).click();
    const detail = page.getByRole('dialog', { name: '🎭 작품 참관 신청 상세' });
    await expect(detail.getByText('fixture-1-w3-동기')).toBeVisible();
    await expect(detail.getByText('31세')).toBeVisible();
    await detail.getByRole('button', { name: '거절' }).click();
    await expect(confirmDialog(page)).toContainText(
      `${NAME}님의 신청을 거절하시겠습니까?`
    );
    await confirmDialog(page).getByRole('button', { name: '거절' }).click();
    await expect(detail.getByText('거절', { exact: true })).toBeVisible();
    await expect(
      detail.getByText(/^처리일: \d{4}\.\d{2}\.\d{2}$/)
    ).toBeVisible();
    await expect(detail.getByRole('button', { name: '승인' })).toHaveCount(0);
  });

  test('상태 필터 "대기"는 대기 신청만, 21건 이상이면 페이지네이션을 보여 준다', async ({
    page,
    request,
  }) => {
    await seed(
      request,
      Array.from({ length: 21 }, (_, i) => ({
        applicantName: `fixture-1-w3-신청자-${i}`,
        createdAt: new Date(Date.UTC(2026, 10, 1, 0, i)).toISOString(),
      }))
    );
    await seed(request, [
      { status: 'APPROVED', applicantName: 'fixture-1-w3-승인' },
    ]);
    await page.goto('/applications');
    await expect(page.getByText('총 22건')).toBeVisible();
    await expect(
      page.getByRole('button', { name: '다음 페이지' })
    ).toBeVisible();

    await page.getByRole('combobox', { name: '상태 필터:' }).click();
    await page.getByRole('option', { name: '대기' }).click();
    await expect(page.getByText('총 21건')).toBeVisible();
    await expect(page.getByText('fixture-1-w3-승인')).toHaveCount(0);
    await page.getByRole('button', { name: '2', exact: true }).click();
    await expect(
      page
        .getByText('fixture-1-w3-신청자-0', { exact: true })
        .filter({ visible: true })
    ).toBeVisible();
  });
});
