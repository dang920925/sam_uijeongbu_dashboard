// ----------------------------------------------------------------------
// SCR-D06 신청서 관리(FN-13, 사용자 결정 2026-11-19 D6 "승인과 등록 분리") — 수용 기준을 화면·API 로 확인한다.
// 신청은 홈페이지가 만들므로 목 시드(`/__mock/seed/applications`)로 넣는다. 픽스처 접두사 fixture-1-w3-(기존) · fixture-u31-(U31 보강).
// U31 보강(designer §18.3): 참관/상담 탭 → 한 목록 + 유형 pill, 행 끝 동작 버튼 → 행(이름 버튼·xs 카드) 클릭 → 상세 드로어.
// 기존 승인·거절·단원 등록 흐름은 의미 그대로, 동작 버튼을 드로어 안에서 누르도록 선택자만 바꿨다.
// desktop(lg 한 행 목록)·mobile(xs 카드 · 전체 화면 드로어) 모두 같은 흐름으로 돈다.
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
  id?: string;
  appType?: 'WORK_OBSERVATION' | 'CONSULTATION';
  applicantName?: string;
  phone?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  performance?: { id: string; title: string } | null;
  preferredDate?: string | null;
  consultationMethod?: string | null;
  preferredTime?: string | null;
  motivation?: string | null;
  question?: string | null;
  age?: number | null;
  createdAt?: string;
  interestedPerformances?: { id: string; title: string }[];
  interestUndecided?: boolean | null;
  contactedAt?: string | null;
  contactNote?: string | null;
  progress?: string;
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

/** 행 열기 — lg 이름 버튼 / xs 카드(카드 전체가 버튼, 이름 포함) */
async function openDetail(page: Page, name: string) {
  await page
    .getByRole('button', { name })
    .filter({ visible: true })
    .first()
    .click();
}

const VISIT_DETAIL = '🎭 작품 참관 신청 상세';
const CONSULT_DETAIL = '💬 방문 상담 신청 상세';

test.describe('SCR-D06 신청서 관리', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('신청이 없으면 유형 pill 별 빈 문구를 보여 준다', async ({ page }) => {
    await page.goto('/applications');
    await expect(
      page.getByRole('heading', { level: 1, name: '참관 신청 관리' })
    ).toBeVisible();
    await expect(page.getByText('조건에 맞는 신청이 없습니다')).toBeVisible();
    await page.getByRole('button', { name: '참관', exact: true }).click();
    await expect(page.getByText('참관 신청이 없습니다')).toBeVisible();
    await page.getByRole('button', { name: '상담', exact: true }).click();
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

    await openDetail(page, NAME);
    const detail = page.getByRole('dialog', { name: VISIT_DETAIL });
    await detail.getByRole('button', { name: '승인', exact: true }).click();
    await expect(confirmDialog(page)).toContainText(
      `${NAME}님의 신청을 승인하시겠습니까?`
    );
    await confirmDialog(page).getByRole('button', { name: '승인' }).click();

    await expect(
      detail.getByRole('button', { name: '단원으로 등록' })
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
    await page.getByRole('button', { name: '상담', exact: true }).click();
    await expect(
      page.getByText('평일 저녁 (18~21시)').filter({ visible: true }).first()
    ).toBeVisible();
    await openDetail(page, NAME);
    const detail = page.getByRole('dialog', { name: CONSULT_DETAIL });
    await detail.getByRole('button', { name: '승인', exact: true }).click();
    await confirmDialog(page).getByRole('button', { name: '승인' }).click();
    await expect(
      detail.getByRole('button', { name: '단원으로 등록' })
    ).toBeVisible();
    // 두 건 모두 승인(행 처리 상태 Label) — 단원은 0명
    await expect(
      page.getByText('승인', { exact: true }).filter({ visible: true })
    ).toHaveCount(3);
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
    await openDetail(page, NAME);
    const detail = page.getByRole('dialog', { name: VISIT_DETAIL });
    await detail.getByRole('button', { name: '단원으로 등록' }).click();

    const dialog = page.getByRole('dialog', { name: '단원으로 등록' });
    await expect(dialog.getByLabel('이름')).toHaveValue(NAME);
    await expect(dialog.getByLabel('연락처')).toHaveValue('010-1234-5678');
    await dialog.getByLabel('이름').fill('fixture-1-w3-새단원');
    await dialog.getByRole('button', { name: '등록' }).click();

    await expect(page.getByText('단원으로 등록되었습니다.')).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByText('단원 등록됨').filter({ visible: true }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '단원으로 등록' })
    ).toHaveCount(0);
    expect(await memberCount(request)).toBe(1);

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
    await openDetail(page, NAME);
    await page
      .getByRole('dialog', { name: VISIT_DETAIL })
      .getByRole('button', { name: '단원으로 등록' })
      .click();
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
    await openDetail(page, NAME);
    await page
      .getByRole('dialog', { name: VISIT_DETAIL })
      .getByRole('button', { name: '단원으로 등록' })
      .click();
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

    await openDetail(page, NAME);
    await page
      .getByRole('dialog', { name: VISIT_DETAIL })
      .getByRole('button', { name: '승인', exact: true })
      .click();
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
    await openDetail(page, NAME);
    const detail = page.getByRole('dialog', { name: VISIT_DETAIL });
    await expect(detail.getByText('fixture-1-w3-동기')).toBeVisible();
    await expect(detail.getByText('31세')).toBeVisible();
    await detail.getByRole('button', { name: '거절' }).click();
    await expect(confirmDialog(page)).toContainText(
      `${NAME}님의 신청을 거절하시겠습니까?`
    );
    await confirmDialog(page).getByRole('button', { name: '거절' }).click();
    await expect(detail.getByText('거절', { exact: true })).toBeVisible();
    // U31 드로어 요약 한 줄 "신청일 … · 처리일: …"
    await expect(
      detail.getByText(/처리일: \d{4}\.\d{2}\.\d{2}$/)
    ).toBeVisible();
    // 거절하면 진행은 불참(서버 DROPPED)이고 스텝퍼는 잠긴다
    await expect(detail.getByRole('radio', { name: '불참' })).toBeDisabled();
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

    await page.getByRole('combobox', { name: '처리 상태' }).click();
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

// ----------------------------------------------------------------------
// U31 보강(develop §15.5 AP-12·AP-14·AP-16 · §13.2 C-8 D06 부분) — 한 행 목록·상세 드로어·필터·"일정 취소됨".
// ----------------------------------------------------------------------
const U31 = 'fixture-u31-';
const WORKS = [
  { id: 'p-u31-1', title: `${U31}작품가` },
  { id: 'p-u31-2', title: `${U31}작품나` },
  { id: 'p-u31-3', title: `${U31}작품다` },
  { id: 'p-u31-4', title: `${U31}작품라` },
];

async function createPerformance(
  request: APIRequestContext,
  title: string
): Promise<{ id: string; title: string }> {
  const created = await adminApi<{ id: string; title: string }>(
    request,
    'POST',
    '/admin/performances',
    { title, type: 'PLAY', status: 'ONGOING' }
  );
  return { id: created.id, title: created.title };
}

interface ApplicationState {
  contactedAt: string | null;
  contactNote: string | null;
  progress: string;
}

async function getApplication(
  request: APIRequestContext,
  id: string
): Promise<ApplicationState> {
  return adminApi<ApplicationState>(
    request,
    'GET',
    `/admin/applications/${id}`
  );
}

test.describe('SCR-D06 U31 보강 — 한 행 목록·드로어', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('AP-14 lg: 신청 1건이 한 행이고 희망 작품이 넘치면 "+n", 행에서 연락·진행을 바꾼다', async ({
    page,
    request,
    isMobile,
  }) => {
    test.skip(isMobile, 'lg 한 행 목록은 데스크톱에서 확인');
    const name = `${U31}상담자`;
    const [app] = await seed(request, [
      {
        appType: 'CONSULTATION',
        applicantName: name,
        consultationMethod: 'PHONE',
        preferredTime: 'WEEKDAY_EVENING',
        interestedPerformances: WORKS,
        interestUndecided: false,
      },
    ]);
    await page.goto('/applications');
    await expect(page.getByText('미처리 1건 · 연락 전 1건')).toBeVisible();
    const row = page.getByRole('row').filter({ hasText: name });
    // 8열 한 줄 — 유형·이름/연락처·작품·희망 일정·연락·진행·처리 상태·접수일
    await expect(page.getByRole('columnheader')).toHaveText(
      [
        '유형',
        '이름 / 연락처',
        '작품',
        '희망 일정',
        '연락',
        '진행',
        '처리 상태',
        '접수일',
      ],
      { useInnerText: true }
    );
    // lg 는 칩 2개 + "+2"(md 용 1개 + "+3" 묶음은 숨겨져 있다)
    await expect(
      row.getByText(WORKS[0].title).filter({ visible: true })
    ).toHaveCount(1);
    await expect(row.getByText(WORKS[1].title)).toBeVisible();
    await expect(row.getByText('+2', { exact: true })).toBeVisible();
    await expect(row.getByText(WORKS[2].title)).toHaveCount(0);
    const box = await row.boundingBox();
    expect(box?.height ?? 0).toBeLessThanOrEqual(64);

    // 연락 — 행에서 바로 토글(빈 고리 "연락 전" → 체크 + "MM.DD HH:mm")
    const toggle = row.getByRole('switch', { name: '연락 완료' });
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(row.getByText('연락 전')).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(row.getByText(/^\d{2}\.\d{2} \d{2}:\d{2}$/)).toBeVisible();
    await expect(page.getByText('미처리 1건 · 연락 전 0건')).toBeVisible();
    expect((await getApplication(request, app.id)).contactedAt).not.toBeNull();
    // 행 토글은 드로어를 열지 않는다
    await expect(
      page.getByRole('dialog', { name: CONSULT_DETAIL })
    ).toHaveCount(0);

    // 진행 — Label 버튼 ▾ → 단계 메뉴(상담 단계 이름)
    await row.getByRole('button', { name: '진행 단계 접수, 바꾸기' }).click();
    await expect(page.getByRole('menuitem')).toHaveText([
      '접수',
      '상담 예정',
      '상담 완료',
      '입단',
      '보류',
    ]);
    await page.getByRole('menuitem', { name: '상담 예정' }).click();
    await expect(
      row.getByRole('button', { name: '진행 단계 상담 예정, 바꾸기' })
    ).toBeVisible();
    expect((await getApplication(request, app.id)).progress).toBe('SCHEDULED');
    await expect(
      page.getByRole('dialog', { name: CONSULT_DETAIL })
    ).toHaveCount(0);
  });

  test('AP-14 드로어: 희망 작품 전체·연락 메모 저장·진행 단계 변경', async ({
    page,
    request,
  }) => {
    const name = `${U31}메모`;
    const [app] = await seed(request, [
      {
        appType: 'CONSULTATION',
        applicantName: name,
        phone: '01012345678',
        interestedPerformances: WORKS,
        interestUndecided: false,
        question: `${U31}문의`,
      },
    ]);
    await page.goto('/applications');
    await openDetail(page, name);
    const detail = page.getByRole('dialog', { name: CONSULT_DETAIL });
    await expect(detail).toBeVisible();
    for (const work of WORKS)
      await expect(detail.getByText(work.title)).toBeVisible();
    await expect(detail.getByText(`${U31}문의`)).toBeVisible();
    await expect(
      detail.getByRole('link', { name: /전화 걸기$/ })
    ).toHaveAttribute('href', 'tel:01012345678');

    // 연락 완료 스위치 → 시각(YYYY.MM.DD HH:mm)
    await detail.getByRole('switch', { name: '연락 완료' }).click();
    await expect(
      detail.getByText(/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/)
    ).toBeVisible();

    // 메모 200자 + 저장
    const memo = detail.getByRole('textbox', { name: '메모' });
    await expect(memo).toHaveAttribute(
      'placeholder',
      '예: 12/6 참관 안내 문자 보냄'
    );
    await memo.fill(`${U31}안내 문자 보냄`);
    await expect(detail.getByText('20/200')).toBeVisible();
    await detail.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('저장되었습니다')).toBeVisible();
    const saved = await getApplication(request, app.id);
    expect(saved.contactNote).toBe(`${U31}안내 문자 보냄`);
    expect(saved.contactedAt).not.toBeNull();

    // 진행 단계 — 스텝퍼(radio)
    await detail.getByRole('radio', { name: '상담 완료' }).click();
    await expect(
      detail.getByRole('radio', { name: '상담 완료' })
    ).toHaveAttribute('aria-checked', 'true');
    expect((await getApplication(request, app.id)).progress).toBe('COMPLETED');
    await detail.getByRole('button', { name: '닫기' }).click();
    await expect(detail).toBeHidden();
  });

  test('AP-14 xs: 카드에 작품 3개 + "+1", 누르면 전체 화면 드로어', async ({
    page,
    request,
    isMobile,
  }) => {
    test.skip(!isMobile, 'xs 카드는 모바일에서 확인');
    const name = `${U31}카드`;
    await seed(request, [
      {
        appType: 'CONSULTATION',
        applicantName: name,
        interestedPerformances: WORKS,
        interestUndecided: false,
        contactedAt: '2026-11-20T05:30:00.000Z',
      },
    ]);
    await page.goto('/applications');
    const card = page.getByRole('button', { name: new RegExp(name) });
    await expect(card).toBeVisible();
    await expect(card.getByText(WORKS[2].title)).toBeVisible();
    await expect(card.getByText('+1', { exact: true })).toBeVisible();
    await expect(card.getByText('연락 완료')).toBeVisible();
    await expect(card.getByText('접수', { exact: true })).toBeVisible();
    await card.click();
    const detail = page.getByRole('dialog', { name: CONSULT_DETAIL });
    await expect(detail).toBeVisible();
    const box = await detail.boundingBox();
    expect(Math.round(box?.width ?? 0)).toBe(page.viewportSize()?.width);
    await expect(detail.getByText('2026.11.20 14:30')).toBeVisible();
  });

  test('AP-12 처리 상태·작품·연락·진행 필터와 정렬이 요청 쿼리로 조합된다', async ({
    page,
    request,
    isMobile,
  }) => {
    const work = await createPerformance(request, `${U31}필터작품`);
    await seed(request, [
      {
        appType: 'CONSULTATION',
        applicantName: `${U31}맞음`,
        interestedPerformances: [work],
        progress: 'SCHEDULED',
      },
      {
        appType: 'CONSULTATION',
        applicantName: `${U31}연락됨`,
        interestedPerformances: [work],
        progress: 'SCHEDULED',
        contactedAt: '2026-11-20T01:00:00.000Z',
      },
      {
        appType: 'CONSULTATION',
        applicantName: `${U31}작품다름`,
        progress: 'SCHEDULED',
      },
      {
        appType: 'WORK_OBSERVATION',
        applicantName: `${U31}참관`,
        performance: work,
        preferredDate: '2026-12-01',
      },
    ]);
    await page.goto('/applications');
    await expect(page.getByText('총 4건')).toBeVisible();

    await page.getByRole('button', { name: '상담', exact: true }).click();
    await expect(page.getByText('총 3건')).toBeVisible();
    const choose = async (label: string, option: string) => {
      await page.getByRole('combobox', { name: label }).click();
      await page.getByRole('option', { name: option, exact: true }).click();
    };
    await choose('처리 상태', '대기');
    await choose('작품', work.title);
    await expect(page.getByText('총 2건')).toBeVisible();
    await choose('연락', '연락 전');
    const last = page.waitForRequest(
      (req) =>
        req.url().includes('/api/backend/v1/admin/applications?') &&
        req.url().includes('progress=SCHEDULED')
    );
    await choose('진행', '상담 예정');
    const url = new URL((await last).url());
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      appType: 'CONSULTATION',
      status: 'PENDING',
      performanceId: work.id,
      contacted: 'false',
      progress: 'SCHEDULED',
      sort: 'createdAt',
      order: 'desc',
    });
    await expect(page.getByText('총 1건')).toBeVisible();
    await expect(
      page.getByText(`${U31}맞음`).filter({ visible: true })
    ).toBeVisible();

    if (!isMobile) {
      // 정렬 — 연락 머리: 연락 시각 내림차순 → 다시 누르면 오름차순
      const sorted = page.waitForRequest((req) =>
        req.url().includes('sort=contactedAt&order=desc')
      );
      await page.getByRole('button', { name: '연락', exact: true }).click();
      await sorted;
      await expect(
        page.getByRole('columnheader', { name: '연락', exact: true })
      ).toHaveAttribute('aria-sort', 'descending');
      const flipped = page.waitForRequest((req) =>
        req.url().includes('sort=contactedAt&order=asc')
      );
      await page.getByRole('button', { name: '연락', exact: true }).click();
      await flipped;
    }

    // 결과 없음
    await choose('진행', '보류');
    await expect(page.getByText('조건에 맞는 신청이 없습니다')).toBeVisible();
  });

  test('AP-16 참관 행은 참관 작품과 관심 작품을 따로 보인다', async ({
    page,
    request,
  }) => {
    const name = `${U31}참관자`;
    await seed(request, [
      {
        appType: 'WORK_OBSERVATION',
        applicantName: name,
        performance: WORKS[0],
        preferredDate: '2026-12-13',
        interestedPerformances: [WORKS[1]],
        interestUndecided: false,
      },
    ]);
    await page.goto('/applications');
    await expect(
      page.getByText(`참관 ${WORKS[0].title}`).filter({ visible: true })
    ).toBeVisible();
    await expect(
      page.getByText(WORKS[1].title, { exact: true }).filter({ visible: true })
    ).toBeVisible();
    await openDetail(page, name);
    const detail = page.getByRole('dialog', { name: VISIT_DETAIL });
    await expect(detail.getByText('참관 작품')).toBeVisible();
    await expect(
      detail.getByText(WORKS[0].title, { exact: true })
    ).toBeVisible();
    await expect(detail.getByText('관심 작품')).toBeVisible();
    await expect(
      detail.getByText(WORKS[1].title, { exact: true })
    ).toBeVisible();
  });

  test('C-8 일정을 참관 막고 취소하면 그 날 참관 신청에 "일정 취소됨"과 사유가 보인다', async ({
    page,
    request,
  }) => {
    const work = await createPerformance(request, `${U31}취소작품`);
    const schedule = await adminApi<{ id: string }>(
      request,
      'POST',
      '/admin/schedules',
      {
        title: `${U31}연습`,
        type: 'PRACTICE',
        startAt: '2026-12-13T19:00:00+09:00',
        performanceId: work.id,
      }
    );
    await adminApi(request, 'POST', `/admin/schedules/${schedule.id}/cancel`, {
      reason: `${U31}단체관람`,
      observationClosed: true,
    });
    await seed(request, [
      {
        applicantName: `${U31}취소됨`,
        performance: work,
        preferredDate: '2026-12-13',
      },
      {
        applicantName: `${U31}다른날`,
        performance: work,
        preferredDate: '2026-12-14',
      },
    ]);
    await page.goto('/applications');
    await expect(
      page.getByText('일정 취소됨').filter({ visible: true })
    ).toHaveCount(1);
    await expect(
      page.getByText(`사유: ${U31}단체관람`).filter({ visible: true })
    ).toBeVisible();
    await openDetail(page, `${U31}취소됨`);
    const detail = page.getByRole('dialog', { name: VISIT_DETAIL });
    await expect(detail.getByText('일정 취소됨')).toBeVisible();
    await expect(detail.getByText(`사유: ${U31}단체관람`)).toBeVisible();
  });

  test('APP_012 거절된 신청의 진행을 바꾸면 오류 스낵바, 드로어는 잠긴 상태로 바뀐다', async ({
    page,
    request,
  }) => {
    const name = `${U31}진행오류`;
    const [app] = await seed(request, [{ applicantName: name }]);
    await page.goto('/applications');
    await openDetail(page, name);
    const detail = page.getByRole('dialog', { name: VISIT_DETAIL });
    await expect(
      detail.getByRole('radio', { name: '일정 확정' })
    ).toBeEnabled();
    // 다른 곳에서 먼저 거절됨
    await adminApi(request, 'POST', `/admin/applications/${app.id}/reject`);
    await detail.getByRole('radio', { name: '일정 확정' }).click();
    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: '이 신청에는 그 진행 단계를 쓸 수 없습니다.' })
    ).toBeVisible();
    await expect(detail.getByRole('radio', { name: '불참' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await expect(
      detail.getByRole('radio', { name: '일정 확정' })
    ).toBeDisabled();
  });
});
