// ----------------------------------------------------------------------
// SCR-D05 단원 관리(FN-11·FN-12·FN-18) — 빈 상태, 목록·실제 가입일(B1)·필터, 단원 추가(공용 다이얼로그),
// 일반 단원 패널(연락처·가입일만), 배우 패널 저장(프로필 + 홈페이지 노출 한 버튼 → "저장되었습니다 ✓"),
// 소개 201자 문구, 사진 업로드(ACTOR_PROFILE), URL ?member=<id> 로 패널 열기, 단원 삭제 확인.
// desktop 은 표 옆 패널, mobile 은 전체 폭 시트(Drawer) — 보이는 요소만 골라 같은 테스트로 돈다.
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import { adminApi, pngFile, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-1-w2-';

interface CreatedMember {
  id: string;
  name: string;
  isVisible: boolean;
  profileImageUrl: string | null;
}

interface Profile {
  intro: string | null;
  snsUrl: string | null;
  displayOrder: number;
  filmography: { title: string; role: string | null; year: number }[];
}

function todayKst(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })
    .format(new Date())
    .replaceAll('-', '.');
}

function createMember(
  request: APIRequestContext,
  name: string,
  type: 'ACTOR' | 'GENERAL',
  phone: string | null = null
) {
  return adminApi<CreatedMember>(request, 'POST', '/admin/members', {
    name,
    type,
    phone,
  });
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

test.describe('SCR-D05 단원 관리', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('단원이 없으면 빈 문구를 보인다', async ({ page }) => {
    await page.goto('/members');
    await expect(
      page.getByRole('heading', { level: 1, name: '단원 관리' })
    ).toBeVisible();
    await expect(
      page.getByText('배우 및 일반 단원을 통합 관리합니다')
    ).toBeVisible();
    await expect(page.getByText('등록된 단원이 없습니다')).toBeVisible();
  });

  test('목록에 구분·연락처·실제 가입일을 보이고 배우 필터는 배우만 남긴다', async ({
    page,
    request,
  }) => {
    // Arrange
    await createMember(request, `${PREFIX}배우`, 'ACTOR');
    await createMember(request, `${PREFIX}일반`, 'GENERAL', '010-1234-5678');
    // Act
    await page.goto('/members');
    // Assert
    await expect(visibleText(page, `${PREFIX}배우`)).toBeVisible();
    await expect(visibleText(page, '010-1234-5678')).toBeVisible();
    await expect(
      page.getByText(todayKst()).filter({ visible: true }).first()
    ).toBeVisible();
    await page.getByRole('button', { name: '배우', exact: true }).click();
    await expect(
      page.getByRole('button', { name: '배우', exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(visibleText(page, `${PREFIX}일반`)).toBeHidden();
    await expect(visibleText(page, `${PREFIX}배우`)).toBeVisible();
  });

  test('단원 추가 다이얼로그로 만들면 닫히고 목록에 보인다', async ({
    page,
  }) => {
    // Arrange
    await page.goto('/members');
    await page.getByRole('button', { name: '단원 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '단원 추가' });
    // 이름이 비면 막는다
    await dialog.getByRole('button', { name: '추가', exact: true }).click();
    await expect(dialog.getByText('이름을 입력해주세요')).toBeVisible();
    // Act
    await dialog.getByLabel('이름').fill(`${PREFIX}새 단원`);
    await dialog.getByRole('button', { name: '추가', exact: true }).click();
    // Assert
    await expect(dialog).toBeHidden();
    await expect(visibleText(page, `${PREFIX}새 단원`)).toBeVisible();
  });

  test('일반 단원은 프로필 대신 연락처·가입일을 보인다', async ({
    page,
    request,
  }) => {
    // Arrange
    const name = `${PREFIX}일반 패널`;
    await createMember(request, name, 'GENERAL', '010-2222-3333');
    await page.goto('/members');
    // Act
    await visibleText(page, name).click();
    // Assert
    const sheet = panel(page, name);
    await expect(sheet.getByText('연락처')).toBeVisible();
    await expect(sheet.getByText('010-2222-3333')).toBeVisible();
    await expect(sheet.getByText(todayKst())).toBeVisible();
    await expect(
      sheet.getByRole('button', { name: '프로필 저장' })
    ).toHaveCount(0);
    await expect(page).toHaveURL(/\/members\?member=/);
  });

  test('배우 패널에서 프로필 저장 한 번으로 프로필과 홈페이지 노출을 저장한다', async ({
    page,
    request,
  }) => {
    // Arrange
    const name = `${PREFIX}배우 저장`;
    const member = await createMember(request, name, 'ACTOR');
    await page.goto(`/members?member=${member.id}`);
    const sheet = panel(page, name);
    // Act
    await sheet.getByLabel('홈페이지 노출').check();
    await sheet.getByLabel('소개').fill(`${PREFIX}소개`);
    await sheet.getByLabel('SNS URL').fill('https://instagram.com/fixture');
    await sheet.getByLabel('노출 순서').fill('5');
    await sheet.getByRole('button', { name: '추가', exact: true }).click();
    await sheet.getByLabel('작품명').fill(`${PREFIX}작품`);
    await sheet.getByLabel('배역').fill(`${PREFIX}배역`);
    await sheet.getByLabel('연도').fill('2024');
    await sheet.getByRole('button', { name: '프로필 저장' }).click();
    // Assert
    await expect(sheet.getByText('저장되었습니다 ✓')).toBeVisible();
    const profile = await adminApi<Profile>(
      request,
      'GET',
      `/admin/members/${member.id}/actor-profile`
    );
    expect(profile.intro).toBe(`${PREFIX}소개`);
    expect(profile.snsUrl).toBe('https://instagram.com/fixture');
    expect(profile.displayOrder).toBe(5);
    expect(profile.filmography).toEqual([
      { title: `${PREFIX}작품`, role: `${PREFIX}배역`, year: 2024 },
    ]);
    const saved = await adminApi<CreatedMember>(
      request,
      'GET',
      `/admin/members/${member.id}`
    );
    expect(saved.isVisible).toBe(true);
  });

  test('소개가 201자면 "한 줄 소개는 200자 이내로 입력해주세요." 로 막는다', async ({
    page,
    request,
  }) => {
    // Arrange
    const name = `${PREFIX}배우 소개`;
    const member = await createMember(request, name, 'ACTOR');
    await page.goto(`/members?member=${member.id}`);
    const sheet = panel(page, name);
    // Act
    await sheet.getByLabel('소개').fill('가'.repeat(201));
    await sheet.getByRole('button', { name: '프로필 저장' }).click();
    // Assert
    await expect(
      sheet.getByText('한 줄 소개는 200자 이내로 입력해주세요.')
    ).toBeVisible();
    await expect(sheet.getByText('저장되었습니다 ✓')).toHaveCount(0);
    const profile = await adminApi<Profile>(
      request,
      'GET',
      `/admin/members/${member.id}/actor-profile`
    );
    expect(profile.intro).toBeNull();
  });

  test('이미지 변경으로 올린 사진이 바로 프로필에 저장되고 목록 아바타에도 쓰인다', async ({
    page,
    request,
  }) => {
    // Arrange
    const name = `${PREFIX}배우 사진`;
    const member = await createMember(request, name, 'ACTOR');
    await page.goto(`/members?member=${member.id}`);
    const sheet = panel(page, name);
    // Act
    await sheet.locator('input[type="file"]').setInputFiles(pngFile());
    // Assert
    await expect(sheet.getByRole('img', { name })).toBeVisible();
    await expect
      .poll(async () => {
        const saved = await adminApi<CreatedMember>(
          request,
          'GET',
          `/admin/members/${member.id}`
        );
        return saved.profileImageUrl;
      })
      .not.toBeNull();
  });

  test('단원 삭제는 "{이름}을(를) 삭제하시겠습니까?" 확인 후 지우고 패널을 닫는다', async ({
    page,
    request,
  }) => {
    // Arrange
    const name = `${PREFIX}지울 단원`;
    const member = await createMember(request, name, 'GENERAL');
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
  });

  test('패널 닫기를 누르면 ?member 가 사라지고 패널이 닫힌다', async ({
    page,
    request,
  }) => {
    const name = `${PREFIX}닫기`;
    const member = await createMember(request, name, 'GENERAL');
    await page.goto(`/members?member=${member.id}`);
    await panel(page, name).getByRole('button', { name: '닫기' }).click();
    await expect(page).toHaveURL(/\/members$/);
    await expect(page.getByRole('heading', { level: 2, name })).toHaveCount(0);
  });
});
