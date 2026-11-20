// ----------------------------------------------------------------------
// 연동 SCR-D06 신청서 관리(FN-13, 사용자 결정 2026-11-19 D6 "승인과 등록 분리") — 실서버 /admin/applications*.
// 신청은 홈페이지가 만들므로 공개 신청 API(relayApplication — 중계 비밀)로 접수한다. 참관은 진행중·노출 공연이 필요.
// U31 보강(designer §18.3): 참관/상담 탭 → 유형 pill, 행 끝 동작·"상세 보기" → 이름 버튼으로 드로어를 열고 그 안에서 승인·거절·등록
// (흐름의 뜻은 그대로, 선택자만 바꿈). 이 연동 E2E 는 서버가 U31 보강 필드를 내려야 돈다.
// - 현재 상태: 유형별 빈 문구(서버 빈 페이지 totalPages=0 이어도 오류 없이), "미처리" 없음.
// - (U39, v1.3.0) 승인·거절을 진행 단계로 합침: 상세에 승인·거절 없음, 대기 신청을 바로 "단원으로 등록"
//   (참관 → 호환 상태 APPROVED · 진행 그대로 / 상담 → 진행 JOINED), 옛 거절 신청 /member → 409 APP_009,
//   등록 → 201 + "단원 등록됨" + 상세 단원 링크, 다시 등록 → APP_008 스낵바(다이얼로그 유지), 연결 단원 삭제 후 재등록,
//   진행 불참(DROPPED) → 미처리·대기 수에서 빠지고 되돌릴 수 있음(처리 상태 칸·처리일 없음),
//   진행 필터 "불참·보류"·"접수" + 21건부터 페이지네이션,
//   (확인 필요 Q4) 신청 공연을 소프트 삭제한 뒤 목록·상세의 연결 공연 표시.
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
  relayApplication,
} from '@/e2e-pw/integration/support/integration-api';

const PREFIX = fixturePrefix('applications');
const NAME = `${PREFIX}신청자`;
const API = '/api/backend/v1';
const PREFERRED_DATE = '2030-12-01';

interface Created {
  id: string;
  createdAt: string;
}

interface ApplicationItem {
  id: string;
  status: string;
  performance: { id: string; title: string } | null;
  member: { id: string; name: string } | null;
  processedAt: string | null;
  createdAt: string;
}

/** U31 — 행 이름 버튼(lg)으로 상세 드로어 열기 */
async function openDetail(page: Page, name: string = NAME) {
  await page
    .getByRole('button', { name, exact: true })
    .filter({ visible: true })
    .first()
    .click();
}

let phoneSeq = 0;
/** 같은 연락처·유형·공연의 대기 신청은 APP_006 이라 매번 다른 번호 */
function nextPhone(): string {
  phoneSeq += 1;
  return `010-8${String(phoneSeq).padStart(3, '0')}-0000`;
}

function kstDateOf(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })
    .format(new Date(iso))
    .replaceAll('-', '.');
}

/**
 * U31: 참관 신청 작품은 14일 안 참관 가능 슬롯이 있어야 한다(아니면 PERF_001) — 매일 연습하는 반을 함께 만든다.
 */
async function createOngoingPerformance(title: string): Promise<Created> {
  const performance = await adminApi<Created>('POST', '/admin/performances', {
    title,
    type: 'PLAY',
    status: 'ONGOING',
  });
  await adminApi('POST', `/admin/performances/${performance.id}/classes`, {
    name: `${title} 반`,
    daysOfWeek: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    startTime: '19:00',
    endTime: '21:00',
    deadline: null,
    location: null,
    status: 'ACTIVE',
  });
  return performance;
}

async function observe(
  performanceId: string,
  extra: Record<string, unknown> = {}
): Promise<Created> {
  const res = await relayApplication({
    appType: 'WORK_OBSERVATION',
    applicantName: NAME,
    phone: nextPhone(),
    agreedToPrivacy: true,
    performanceId,
    preferredDate: PREFERRED_DATE,
    ...extra,
  });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body as Created;
}

async function consult(extra: Record<string, unknown> = {}): Promise<Created> {
  const res = await relayApplication({
    appType: 'CONSULTATION',
    applicantName: NAME,
    phone: nextPhone(),
    agreedToPrivacy: true,
    consultationMethod: 'PHONE',
    preferredTime: 'WEEKDAY_EVENING',
    // U31: 참가 희망 작품 또는 '아직 모르겠어요' 필수(APP_010)
    interestUndecided: true,
    ...extra,
  });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body as Created;
}

/** (U39) 승인 단계가 없어져 대기 참관 신청을 바로 단원으로 등록한다 */
async function pendingObservation(): Promise<Created> {
  const performance = await createOngoingPerformance(`${PREFIX}공연`);
  return observe(performance.id);
}

async function memberCount(): Promise<number> {
  return (await adminApi<{ totalCount: number }>('GET', '/admin/members'))
    .totalCount;
}

/** 스낵바(notistack) — Next 경로 안내도 role=alert 라 문구로 고른다 */
const snackbar = (page: Page, text: string) =>
  page.getByRole('alert').filter({ hasText: text });

test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

test.describe('연동 SCR-D06 신청서 관리 — 현재 상태', () => {
  test('신청이 없으면 탭별 빈 문구를 보이고 오류·"미처리" 는 없다', async ({
    page,
  }) => {
    // Arrange
    const errors: string[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/admin/applications') && r.status() >= 400)
        errors.push(`${r.status()} ${r.url()}`);
    });
    // Act
    await page.goto('/applications');
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: '참관 신청 관리' })
    ).toBeVisible();
    await expect(page.getByText('조건에 맞는 신청이 없습니다')).toBeVisible();
    await expect(page.getByText('총 0건')).toBeVisible();
    await page.getByRole('button', { name: '참관', exact: true }).click();
    await expect(page.getByText('참관 신청이 없습니다')).toBeVisible();
    await page.getByRole('button', { name: '상담', exact: true }).click();
    await expect(page.getByText('방문 상담 신청이 없습니다')).toBeVisible();
    await expect(page.getByText(/^미처리/)).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test.describe('연동 SCR-D06 신청서 관리 — 채운 상태', () => {
  test.afterEach(() => cleanupFixtures(FIXTURE_BASE));

  test('(U39) 참관 신청은 공연·희망 날짜·신청일(KST)을 보이고, 상세에 승인·거절 없이 대기 신청을 바로 단원으로 등록한다', async ({
    page,
  }) => {
    // Arrange
    const performance = await createOngoingPerformance(`${PREFIX}참관 공연`);
    const app = await observe(performance.id);
    await page.goto('/applications');
    await expect(page.getByText('미처리 1건')).toBeVisible();
    await expect(page.getByText('총 1건')).toBeVisible();
    const row = page.getByRole('row').filter({ hasText: NAME });
    await expect(row).toContainText(`${PREFIX}참관 공연`);
    await expect(row).toContainText('2030.12.01');
    await expect(row).toContainText(kstDateOf(app.createdAt));
    // Act
    await openDetail(page);
    const detail = page.getByRole('dialog', { name: '🎭 작품 참관 신청 상세' });
    await expect(detail.getByRole('button', { name: '승인' })).toHaveCount(0);
    await expect(detail.getByRole('button', { name: '거절' })).toHaveCount(0);
    await detail.getByRole('button', { name: '단원으로 등록' }).click();
    await page
      .getByRole('dialog', { name: '단원으로 등록' })
      .getByRole('button', { name: '등록' })
      .click();
    // Assert — 참관은 진행 단계를 바꾸지 않고 서버 호환 상태만 APPROVED
    await expect(page.getByText('단원으로 등록되었습니다.')).toBeVisible();
    expect(await memberCount()).toBe(1);
    const after = await adminApi<ApplicationItem & { progress: string }>(
      'GET',
      `/admin/applications/${app.id}`
    );
    expect(after).toMatchObject({ status: 'APPROVED', progress: 'RECEIVED' });
  });

  test('(U39) 상담 건을 단원으로 등록하면 진행이 입단(JOINED)으로 바뀌고 미처리에서 빠진다', async ({
    page,
  }) => {
    // Arrange
    const app = await consult();
    await page.goto('/applications');
    await page.getByRole('button', { name: '상담', exact: true }).click();
    const row = page.getByRole('row').filter({ hasText: NAME });
    await expect(row).toContainText('전화');
    await expect(row).toContainText('평일 저녁 (18~21시)');
    // Act
    await openDetail(page);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: '단원으로 등록' })
      .click();
    await page
      .getByRole('dialog', { name: '단원으로 등록' })
      .getByRole('button', { name: '등록' })
      .click();
    // Assert
    await expect(page.getByText('단원으로 등록되었습니다.')).toBeVisible();
    const after = await adminApi<{ progress: string }>(
      'GET',
      `/admin/applications/${app.id}`
    );
    expect(after.progress).toBe('JOINED');
    expect(await memberCount()).toBe(1);
  });

  test('(U39) 옛 거절 신청에 단원 등록을 요청하면 409 APP_009', async ({
    page,
  }) => {
    // Arrange — 거절 API 는 호환용으로 남아 있다(대시보드는 부르지 않음)
    const app = await consult();
    await adminApi('POST', `/admin/applications/${app.id}/reject`);
    // Act
    const response = await page.request.post(
      `${API}/admin/applications/${app.id}/member`,
      { data: { name: NAME, phone: null, type: 'GENERAL' } }
    );
    // Assert
    expect(response.status()).toBe(409);
    expect(await response.json()).toMatchObject({
      code: 'APP_009',
      message: '거절된 신청은 단원으로 등록할 수 없습니다.',
    });
    expect(await memberCount()).toBe(0);
  });

  test('(U39) 대기 신청을 단원으로 등록하면 201, "단원 등록됨", 상세에 단원 링크가 생긴다', async ({
    page,
  }) => {
    // Arrange
    const app = await pendingObservation();
    await page.goto('/applications');
    await openDetail(page);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: '단원으로 등록' })
      .click();
    const dialog = page.getByRole('dialog', { name: '단원으로 등록' });
    await expect(dialog.getByLabel('이름')).toHaveValue(NAME);
    await expect(dialog.getByLabel('연락처')).toHaveValue(/^010-8\d{3}-0000$/);
    await dialog.getByLabel('이름').fill(`${PREFIX}새단원`);
    // Act
    const register = page.waitForResponse(
      `**/admin/applications/${app.id}/member`
    );
    await dialog.getByRole('button', { name: '등록' }).click();
    // Assert
    const response = await register;
    expect(response.status()).toBe(201);
    const body = (await response.json()) as {
      application: ApplicationItem;
      member: { id: string; name: string; type: string };
    };
    expect(body.member).toMatchObject({
      name: `${PREFIX}새단원`,
      type: 'GENERAL',
    });
    expect(body.application.member?.id).toBe(body.member.id);
    await expect(page.getByText('단원으로 등록되었습니다.')).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByText('단원 등록됨').filter({ visible: true }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '단원으로 등록' })
    ).toHaveCount(0);
    expect(await memberCount()).toBe(1);
    await openDetail(page);
    const detail = page.getByRole('dialog', { name: '🎭 작품 참관 신청 상세' });
    const link = detail.getByRole('link', { name: `${PREFIX}새단원` });
    await expect(link).toHaveAttribute(
      'href',
      `/members?member=${body.member.id}`
    );
    // 링크 → 단원 관리 패널
    await link.click();
    await expect(page).toHaveURL(
      new RegExp(`/members\\?member=${body.member.id}$`)
    );
    await expect(
      page.getByRole('heading', { level: 2, name: `${PREFIX}새단원` })
    ).toBeVisible();
  });

  test('이미 등록된 신청을 다시 등록하면 APP_008 스낵바, 등록 다이얼로그는 열려 있다', async ({
    page,
  }) => {
    // Arrange
    const app = await pendingObservation();
    await page.goto('/applications');
    await openDetail(page);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: '단원으로 등록' })
      .click();
    const dialog = page.getByRole('dialog', { name: '단원으로 등록' });
    await expect(dialog).toBeVisible();
    // 다른 곳에서 먼저 등록됨
    await adminApi('POST', `/admin/applications/${app.id}/member`, {
      name: NAME,
      phone: null,
      type: 'GENERAL',
    });
    // Act
    const register = page.waitForResponse(
      `**/admin/applications/${app.id}/member`
    );
    await dialog.getByRole('button', { name: '등록' }).click();
    // Assert
    expect((await register).status()).toBe(409);
    await expect(
      snackbar(page, '이미 단원으로 등록된 신청입니다.')
    ).toBeVisible();
    await expect(dialog).toBeVisible();
    expect(await memberCount()).toBe(1);
  });

  test('연결 단원을 삭제하면 같은 신청을 다시 등록할 수 있다', async ({
    page,
  }) => {
    // Arrange
    const app = await pendingObservation();
    const first = await adminApi<{ member: { id: string } }>(
      'POST',
      `/admin/applications/${app.id}/member`,
      { name: NAME, phone: null, type: 'GENERAL' }
    );
    await adminApi('DELETE', `/admin/members/${first.member.id}`);
    // Act — 삭제된 단원은 member null → 다시 "단원으로 등록"
    await page.goto('/applications');
    await expect(page.getByText('단원 등록됨')).toHaveCount(0);
    await openDetail(page);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: '단원으로 등록' })
      .click();
    await page
      .getByRole('dialog', { name: '단원으로 등록' })
      .getByRole('button', { name: '등록' })
      .click();
    // Assert
    await expect(page.getByText('단원으로 등록되었습니다.')).toBeVisible();
    const detail = await adminApi<ApplicationItem>(
      'GET',
      `/admin/applications/${app.id}`
    );
    expect(detail.member).not.toBeNull();
    expect(detail.member?.id).not.toBe(first.member.id);
    expect(await memberCount()).toBe(1);
  });

  test('(U39) 진행을 불참으로 바꾸면 미처리·대기 수에서 빠지고 처리 상태 칸·처리일은 없으며 되돌릴 수 있다', async ({
    page,
  }) => {
    // Arrange
    const performance = await createOngoingPerformance(`${PREFIX}불참 공연`);
    const app = await observe(performance.id, { motivation: `${PREFIX}동기` });
    const before = await adminApi<{ count: number }>(
      'GET',
      '/admin/applications/pending-count'
    );
    await page.goto('/applications');
    await expect(page.getByText('미처리 1건')).toBeVisible();
    await expect(page.getByRole('combobox', { name: '처리 상태' })).toHaveCount(
      0
    );
    await openDetail(page);
    const detail = page.getByRole('dialog', { name: '🎭 작품 참관 신청 상세' });
    await expect(detail.getByText(`${PREFIX}동기`)).toBeVisible();
    await expect(detail.getByText(/처리일/)).toHaveCount(0);
    // Act
    const saved = page.waitForResponse(
      `**/admin/applications/${app.id}/progress`
    );
    await detail.getByRole('radio', { name: '불참' }).click();
    expect((await saved).status()).toBe(200);
    // Assert
    await expect(detail.getByRole('radio', { name: '불참' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await expect(page.getByText(/^미처리/)).toHaveCount(0);
    const after = await adminApi<{ status: string; progress: string }>(
      'GET',
      `/admin/applications/${app.id}`
    );
    expect(after).toMatchObject({ status: 'PENDING', progress: 'DROPPED' });
    expect(
      (
        await adminApi<{ count: number }>(
          'GET',
          '/admin/applications/pending-count'
        )
      ).count
    ).toBe(before.count - 1);
    await expect(
      detail.getByRole('radio', { name: '일정 확정' })
    ).toBeEnabled();
  });

  test('진행 필터 불참·보류(상담 "보류")는 그 신청만, "접수" 21건이면 페이지네이션을 보인다', async ({
    page,
  }) => {
    // Arrange — 접수 21 + 불참 1(상담)
    for (let i = 0; i < 21; i += 1)
      await consult({ applicantName: `${PREFIX}신청자-${i}` });
    const dropped = await consult({ applicantName: `${PREFIX}불참` });
    await adminApi('PATCH', `/admin/applications/${dropped.id}/progress`, {
      progress: 'DROPPED',
    });
    await page.goto('/applications');
    await page.getByRole('button', { name: '상담', exact: true }).click();
    await expect(page.getByText('총 22건')).toBeVisible();
    await expect(page.getByText('미처리 21건')).toBeVisible();
    await expect(
      page.getByRole('button', { name: '다음 페이지' })
    ).toBeVisible();
    // Act + Assert — 상담의 DROPPED 라벨은 '보류'(참관은 '불참')
    await page.getByRole('combobox', { name: '진행' }).click();
    await page.getByRole('option', { name: /^(불참|보류)/ }).click();
    await expect(page.getByText('총 1건')).toBeVisible();
    await expect(
      page.getByText(`${PREFIX}불참`).filter({ visible: true }).first()
    ).toBeVisible();
    // Act + Assert — 접수
    await page.getByRole('combobox', { name: '진행' }).click();
    await page.getByRole('option', { name: '접수', exact: true }).click();
    await expect(page.getByText('총 21건')).toBeVisible();
    await expect(page.getByText(`${PREFIX}불참`)).toHaveCount(0);
    await page.getByRole('button', { name: '2', exact: true }).click();
    await expect(
      page
        .getByText(`${PREFIX}신청자-0`, { exact: true })
        .filter({ visible: true })
    ).toBeVisible();
  });

  test('(Q4) 신청한 공연을 소프트 삭제해도 목록·상세에 공연 제목이 그대로 보인다', async ({
    page,
  }) => {
    // Arrange
    const title = `${PREFIX}삭제될 공연`;
    const performance = await createOngoingPerformance(title);
    const app = await observe(performance.id);
    await adminApi('DELETE', `/admin/performances/${performance.id}`);
    // Act
    const detail = await adminApi<ApplicationItem>(
      'GET',
      `/admin/applications/${app.id}`
    );
    await page.goto('/applications');
    // Assert — 서버 응답(사실 기록)
    expect(detail.performance).toEqual({ id: performance.id, title });
    const row = page.getByRole('row').filter({ hasText: NAME });
    await expect(row).toContainText(title);
    await openDetail(page);
    await expect(
      page
        .getByRole('dialog', { name: '🎭 작품 참관 신청 상세' })
        .getByText(title)
    ).toBeVisible();
  });
});
