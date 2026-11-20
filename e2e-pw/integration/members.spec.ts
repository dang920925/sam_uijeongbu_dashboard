// ----------------------------------------------------------------------
// 연동 SCR-D05 단원 관리·배우 프로필(FN-11·12) — 실서버 /admin/members*, /admin/members/{id}/actor-profile.
// - 현재 상태: 빈 문구. 없는 단원 id(?member=) → 패널에 서버 MEM_001 문구 + 다시 시도.
// - 채운 상태: 구분·연락처·가입일(서버 joinedAt = 오늘 KST, B1), 배우 필터(?type=ACTOR),
//   단원 추가(서버 400 연락처 문구는 다이얼로그 안 → 201 이면 닫힘 · 노출 꺼짐 · 가입일 오늘),
//   일반 단원 패널(연락처·가입일), 배우 프로필 저장(PATCH actor-profile → 노출이 바뀌면 PATCH members),
//   SNS 주소 서버 검증 실패는 스낵바, 소개 201자는 화면 문구로 막고 요청하지 않음, 삭제(소프트) → 404 MEM_001.
// 사진 업로드(ACTOR_PROFILE)는 업로드 묶음(W4)이 확인한다.
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
  INT_API_BASE_URL,
  adminToken,
} from '@/e2e-pw/integration/support/integration-api';

const PREFIX = fixturePrefix('members');
const UNKNOWN_ID = '0190f000-0000-7000-8000-00000000fffe';

interface MemberItem {
  id: string;
  name: string;
  type: 'ACTOR' | 'GENERAL';
  phone: string | null;
  isVisible: boolean;
  joinedAt: string | null;
}

interface Profile {
  intro: string | null;
  snsUrl: string | null;
  activityStart: string | null;
  displayOrder: number;
  filmography: { title: string; role: string | null; year: number }[];
}

function todayKst(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date()
  );
}

function createMember(
  name: string,
  type: 'ACTOR' | 'GENERAL',
  phone: string | null = null
): Promise<MemberItem> {
  return adminApi<MemberItem>('POST', '/admin/members', { name, type, phone });
}

const visibleText = (page: Page, text: string) =>
  page.getByText(text, { exact: true }).filter({ visible: true }).first();

/** 패널 — lg 는 aside, md·xs 는 Drawer(dialog) */
function panel(page: Page, name: string) {
  return page
    .locator('aside, [role="dialog"]')
    .filter({ has: page.getByRole('heading', { level: 2, name }) })
    .filter({ visible: true });
}

/** 스낵바(notistack) — Next 경로 안내도 role=alert 라 문구로 고른다 */
const snackbar = (page: Page, text: string) =>
  page.getByRole('alert').filter({ hasText: text });

test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

test.describe('연동 SCR-D05 단원 관리 — 현재 상태', () => {
  test('단원이 없으면 빈 문구를 보인다', async ({ page }) => {
    // Act
    await page.goto('/members');
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: '단원 관리' })
    ).toBeVisible();
    await expect(page.getByText('등록된 단원이 없습니다')).toBeVisible();
  });

  test('없는 단원 id 로 패널을 열면 서버 MEM_001 문구와 다시 시도를 보인다', async ({
    page,
  }) => {
    // Act
    const detail = page.waitForResponse(`**/admin/members/${UNKNOWN_ID}`);
    await page.goto(`/members?member=${UNKNOWN_ID}`);
    // Assert
    expect((await detail).status()).toBe(404);
    await expect(
      page.getByText('단원 정보를 찾을 수 없습니다.').filter({ visible: true })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '다시 시도' }).filter({ visible: true })
    ).toBeVisible();
  });
});

test.describe('연동 SCR-D05 단원 관리 — 채운 상태', () => {
  test.afterEach(() => cleanupFixtures(FIXTURE_BASE));

  test('목록에 구분·연락처·서버 가입일을 보이고 배우 필터는 type=ACTOR 로 다시 조회한다', async ({
    page,
  }) => {
    // Arrange
    const actor = await createMember(`${PREFIX}배우`, 'ACTOR');
    await createMember(`${PREFIX}일반`, 'GENERAL', '010-1234-5678');
    expect(actor.joinedAt).toBe(todayKst());
    // Act
    await page.goto('/members');
    // Assert
    const actorRow = page.getByRole('row').filter({ hasText: `${PREFIX}배우` });
    await expect(actorRow).toContainText('배우');
    await expect(actorRow).toContainText(todayKst().replaceAll('-', '.'));
    await expect(actorRow.getByText('-', { exact: true })).toBeVisible();
    const generalRow = page
      .getByRole('row')
      .filter({ hasText: `${PREFIX}일반` });
    await expect(generalRow).toContainText('일반');
    await expect(generalRow).toContainText('010-1234-5678');
    // Act — 필터
    const filtered = page.waitForResponse((r) =>
      r.url().includes('/admin/members?type=ACTOR')
    );
    await page.getByRole('button', { name: '배우', exact: true }).click();
    // Assert
    expect((await filtered).status()).toBe(200);
    await expect(
      page.getByRole('button', { name: '배우', exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(visibleText(page, `${PREFIX}일반`)).toBeHidden();
    await expect(visibleText(page, `${PREFIX}배우`)).toBeVisible();
  });

  test('단원 추가 — 서버가 거부한 연락처는 다이얼로그 안 문구, 고치면 201 로 만들어 목록에 보인다', async ({
    page,
  }) => {
    // Arrange
    await page.goto('/members');
    await page.getByRole('button', { name: '단원 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '단원 추가' });
    await dialog.getByLabel('이름').fill(`${PREFIX}새 단원`);
    await dialog.getByLabel('연락처').fill('12-34');
    // Act — 서버 400(연락처 형식)
    await dialog.getByRole('button', { name: '추가', exact: true }).click();
    // Assert
    await expect(
      dialog.getByText('올바른 연락처 형식이 아닙니다.')
    ).toBeVisible();
    // Act — 고쳐서 다시
    await dialog.getByLabel('연락처').fill('010-5555-6666');
    await dialog.getByRole('button', { name: '추가', exact: true }).click();
    // Assert
    await expect(dialog).toBeHidden();
    await expect(visibleText(page, `${PREFIX}새 단원`)).toBeVisible();
    const list = await adminApi<{ items: MemberItem[] }>(
      'GET',
      '/admin/members'
    );
    expect(list.items).toEqual([
      expect.objectContaining({
        name: `${PREFIX}새 단원`,
        type: 'GENERAL',
        phone: '010-5555-6666',
        isVisible: false,
        joinedAt: todayKst(),
      }),
    ]);
  });

  test('일반 단원 패널은 프로필 대신 연락처·가입일을 보인다', async ({
    page,
  }) => {
    // Arrange
    const name = `${PREFIX}일반 패널`;
    await createMember(name, 'GENERAL', '010-2222-3333');
    await page.goto('/members');
    // Act
    await visibleText(page, name).click();
    // Assert
    const sheet = panel(page, name);
    await expect(sheet.getByText('010-2222-3333')).toBeVisible();
    await expect(
      sheet.getByText(todayKst().replaceAll('-', '.'))
    ).toBeVisible();
    await expect(
      sheet.getByRole('button', { name: '프로필 저장' })
    ).toHaveCount(0);
    await expect(page).toHaveURL(/\/members\?member=/);
  });

  test('배우 프로필 저장 한 번으로 프로필(PATCH actor-profile)과 홈페이지 노출(PATCH members)을 저장한다', async ({
    page,
  }) => {
    // Arrange
    const name = `${PREFIX}배우 저장`;
    const member = await createMember(name, 'ACTOR');
    const writes: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'PATCH') writes.push(new URL(req.url()).pathname);
    });
    await page.goto(`/members?member=${member.id}`);
    const sheet = panel(page, name);
    // Act
    await sheet.getByLabel('홈페이지 노출').check();
    await sheet.getByLabel('소개').fill(`${PREFIX}소개`);
    await sheet.getByLabel('SNS URL').fill('https://instagram.com/fixture');
    await sheet.getByLabel('활동 시작일').fill('2020-03-01');
    await sheet.getByLabel('노출 순서').fill('5');
    await sheet.getByRole('button', { name: '추가', exact: true }).click();
    await sheet.getByLabel('작품명').fill(`${PREFIX}작품`);
    await sheet.getByLabel('연도').fill('2024');
    await sheet.getByRole('button', { name: '프로필 저장' }).click();
    // Assert
    await expect(sheet.getByText('저장되었습니다 ✓')).toBeVisible();
    expect(writes).toEqual([
      `/api/backend/v1/admin/members/${member.id}/actor-profile`,
      `/api/backend/v1/admin/members/${member.id}`,
    ]);
    const profile = await adminApi<Profile>(
      'GET',
      `/admin/members/${member.id}/actor-profile`
    );
    expect(profile).toMatchObject({
      intro: `${PREFIX}소개`,
      snsUrl: 'https://instagram.com/fixture',
      activityStart: '2020-03-01',
      displayOrder: 5,
      filmography: [{ title: `${PREFIX}작품`, role: null, year: 2024 }],
    });
    const saved = await adminApi<MemberItem>(
      'GET',
      `/admin/members/${member.id}`
    );
    expect(saved.isVisible).toBe(true);
    // 다시 열면 서버 값으로 채워진다
    await page.reload();
    const again = panel(page, name);
    await expect(again.getByLabel('홈페이지 노출')).toBeChecked();
    await expect(again.getByLabel('활동 시작일')).toHaveValue('2020-03-01');
    await expect(again.getByLabel('작품명')).toHaveValue(`${PREFIX}작품`);
  });

  test('노출을 바꾸지 않으면 members PATCH 없이 프로필만 저장한다', async ({
    page,
  }) => {
    // Arrange
    const name = `${PREFIX}배우 프로필만`;
    const member = await createMember(name, 'ACTOR');
    const writes: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'PATCH') writes.push(new URL(req.url()).pathname);
    });
    await page.goto(`/members?member=${member.id}`);
    const sheet = panel(page, name);
    // Act
    await sheet.getByLabel('소개').fill(`${PREFIX}소개만`);
    await sheet.getByRole('button', { name: '프로필 저장' }).click();
    // Assert
    await expect(sheet.getByText('저장되었습니다 ✓')).toBeVisible();
    expect(writes).toEqual([
      `/api/backend/v1/admin/members/${member.id}/actor-profile`,
    ]);
  });

  test('SNS 주소를 서버가 거부하면(400) 서버 문구를 스낵바로 보이고 저장 표시는 없다', async ({
    page,
  }) => {
    // Arrange
    const name = `${PREFIX}배우 SNS`;
    const member = await createMember(name, 'ACTOR');
    await page.goto(`/members?member=${member.id}`);
    const sheet = panel(page, name);
    // Act
    await sheet.getByLabel('SNS URL').fill('http://instagram.com/fixture');
    const patch = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/admin/members/${member.id}/actor-profile`) &&
        r.request().method() === 'PATCH'
    );
    await sheet.getByRole('button', { name: '프로필 저장' }).click();
    // Assert
    expect((await patch).status()).toBe(400);
    await expect(
      snackbar(
        page,
        'SNS 주소는 https:// 로 시작하는 500자 이내 주소여야 합니다.'
      )
    ).toBeVisible();
    await expect(sheet.getByText('저장되었습니다 ✓')).toHaveCount(0);
  });

  test('소개가 201자면 "한 줄 소개는 200자 이내로 입력해주세요." 로 막고 서버에 보내지 않는다', async ({
    page,
  }) => {
    // Arrange
    const name = `${PREFIX}배우 소개`;
    const member = await createMember(name, 'ACTOR');
    let patched = false;
    page.on('request', (req) => {
      if (req.method() === 'PATCH') patched = true;
    });
    await page.goto(`/members?member=${member.id}`);
    const sheet = panel(page, name);
    // Act
    await sheet.getByLabel('소개').fill('가'.repeat(201));
    await sheet.getByRole('button', { name: '프로필 저장' }).click();
    // Assert
    await expect(
      sheet.getByText('한 줄 소개는 200자 이내로 입력해주세요.')
    ).toBeVisible();
    expect(patched).toBe(false);
    // 서버도 201자는 같은 문구로 거부한다(계약)
    const response = await fetch(
      `${INT_API_BASE_URL}/api/v1/admin/members/${member.id}/actor-profile`,
      {
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${await adminToken()}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ intro: '가'.repeat(201) }),
      }
    );
    expect(response.status).toBe(400);
    expect(((await response.json()) as { message: string }).message).toBe(
      '한 줄 소개는 200자 이내로 입력해주세요.'
    );
  });

  test('단원 삭제는 확인 후 서버에서 지우고(이후 404 MEM_001) 패널을 닫는다', async ({
    page,
  }) => {
    // Arrange
    const name = `${PREFIX}지울 단원`;
    const member = await createMember(name, 'GENERAL');
    await page.goto(`/members?member=${member.id}`);
    const sheet = panel(page, name);
    // Act
    await sheet.getByRole('button', { name: '단원 삭제' }).click();
    const confirm = page.getByRole('alertdialog');
    await expect(
      confirm.getByText(`${name}을(를) 삭제하시겠습니까?`)
    ).toBeVisible();
    await confirm.getByRole('button', { name: '삭제' }).click();
    // Assert
    await expect(page).toHaveURL(/\/members$/);
    await expect(page.getByText('등록된 단원이 없습니다')).toBeVisible();
    const gone = await fetch(
      `${INT_API_BASE_URL}/api/v1/admin/members/${member.id}`,
      { headers: { authorization: `Bearer ${await adminToken()}` } }
    );
    expect(gone.status).toBe(404);
    expect(((await gone.json()) as { code: string }).code).toBe('MEM_001');
  });
});
