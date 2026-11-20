// ----------------------------------------------------------------------
// 연동 E2E — SCR-D09 연출진 관리(FN-16·FN-18) × 실서버(/api/v1/admin/staff · 공개 GET /api/v1/staff).
// - 현재 상태: 빈 DB → "등록된 연출진이 없습니다", 공개 목록 0건.
// - 채운 상태: 필수 검증 → 사진 업로드(STAFF_PROFILE, 서명 URL PUT) 미리보기·목록 아바타가 실제로 로드 → 추가.
//   노출 순서·노출 토글 수정이 관리 목록과 홈페이지 공개 응답(displayOrder asc, 비노출 제외)에 반영, 삭제 확인 후 사라짐.
//   4xx: 노출 순서 상한(서버 COMMON_001 문구), 다른 곳에서 삭제된 연출진 저장 404 STF_001 문구.
// 픽스처: 연출진 name 은 fixturePrefix('staff') 로 시작.
// ----------------------------------------------------------------------
import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
  INT_API_BASE_URL,
  TINY_PNG,
} from '@/e2e-pw/integration/support/integration-api';

const PREFIX = fixturePrefix('staff');
const EMPTY = '등록된 연출진이 없습니다';

interface AdminStaffItem {
  id: string;
  name: string;
  role: string;
  profileImageUrl: string | null;
  bio: string | null;
  displayOrder: number;
  isVisible: boolean;
}

interface PublicStaffItem {
  id: string;
  name: string;
  role: string;
  profileImageUrl: string | null;
  bio: string | null;
  displayOrder: number;
}

async function expectImageLoaded(image: Locator) {
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((el) => {
        const img = el as HTMLImageElement;
        return img.complete ? img.naturalWidth : 0;
      })
    )
    .toBeGreaterThan(0);
}

function rowOf(page: Page, name: string) {
  return page
    .getByRole('table', { name: '연출진 관리' })
    .getByRole('row')
    .filter({ hasText: name });
}

/** 홈페이지가 부르는 공개 응답(인증 없음) — 픽스처 행만 */
async function publicStaff(): Promise<PublicStaffItem[]> {
  const response = await fetch(`${INT_API_BASE_URL}/api/v1/staff`);
  expect(response.status).toBe(200);
  const body = (await response.json()) as { items: PublicStaffItem[] };
  return body.items.filter((s) => s.name.startsWith(PREFIX));
}

function createStaff(body: Record<string, unknown>) {
  return adminApi<AdminStaffItem>('POST', '/admin/staff', body);
}

test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

test.describe('SCR-D09 연출진 관리 — 현재 상태(빈 DB)', () => {
  test('연출진이 없으면 빈 문구를 보이고 공개 목록도 비어 있다', async ({
    page,
  }) => {
    // Act
    await page.goto('/staff');
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: '연출진 관리' })
    ).toBeVisible();
    await expect(page.getByText(EMPTY)).toBeVisible();
    expect(await publicStaff()).toEqual([]);
  });
});

test.describe('SCR-D09 연출진 관리 — 채운 상태(실서버)', () => {
  // 노출 순서 테스트가 앞 테스트의 연출가(순서 0)를 이어 쓴다
  test.describe.configure({ mode: 'serial' });

  test('필수 검증 뒤 사진을 올려 추가하면 미리보기·아바타가 로드되고 공개 응답에 보인다', async ({
    page,
  }) => {
    // Arrange
    const name = `${PREFIX}연출가`;
    await page.goto('/staff');
    await page.getByRole('button', { name: '연출진 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '연출진 추가' });
    // Act — 빈 제출
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert
    await expect(dialog.getByText('이름을 입력해주세요')).toBeVisible();
    await expect(dialog.getByText('역할을 입력해주세요')).toBeVisible();
    // Act — 사진 업로드(서명 URL)
    const ticket = page.waitForResponse((r) =>
      r.url().endsWith('/api/backend/v1/admin/uploads')
    );
    await dialog.locator('input[type="file"]').setInputFiles({
      name: `${PREFIX}profile.png`,
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    const { publicUrl } = (await (await ticket).json()) as {
      publicUrl: string;
    };
    // Assert — 미리보기 실제 로드
    await expect(
      dialog.getByRole('button', { name: '이미지 변경' })
    ).toBeVisible();
    await expectImageLoaded(dialog.getByRole('img', { name: '사진' }));
    // Act — 필드 채워 추가
    await dialog.getByPlaceholder('이름 입력').fill(name);
    await dialog.getByPlaceholder('예: 예술감독 · 연출').fill('예술감독');
    await dialog.getByPlaceholder('연출진 소개').fill('20년 경력의 연출가');
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert — 목록 행·아바타
    await expect(dialog).toBeHidden();
    await expect(page.getByText('저장되었습니다')).toBeVisible();
    const row = rowOf(page, name);
    await expect(row).toContainText('예술감독');
    await expect(row).toContainText('노출');
    await expectImageLoaded(row.getByRole('img', { name }));
    // Assert — 홈페이지 공개 응답
    const items = await publicStaff();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      name,
      role: '예술감독',
      bio: '20년 경력의 연출가',
      profileImageUrl: publicUrl,
      displayOrder: 0,
    });
  });

  test('노출 순서·노출 토글 수정이 관리 목록과 공개 응답에 반영된다', async ({
    page,
  }) => {
    // Arrange — 순서 1·2 의 두 명(앞 테스트의 연출가는 0)
    const second = `${PREFIX}둘째`;
    const third = `${PREFIX}셋째`;
    await createStaff({ name: second, role: '조연출', displayOrder: 1 });
    await createStaff({ name: third, role: '무대감독', displayOrder: 2 });
    await page.goto('/staff');
    await expect(rowOf(page, third)).toBeVisible();
    // Act — 셋째 순서를 0 으로(둘째보다 앞), 둘째는 비노출
    await rowOf(page, third)
      .getByRole('button', { name: '연출진 수정' })
      .click();
    let dialog = page.getByRole('dialog', { name: '연출진 수정' });
    await expect(dialog.getByPlaceholder('이름 입력')).toHaveValue(third);
    await dialog.getByLabel('노출 순서').fill('0');
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(dialog).toBeHidden();
    await rowOf(page, second)
      .getByRole('button', { name: '연출진 수정' })
      .click();
    dialog = page.getByRole('dialog', { name: '연출진 수정' });
    await dialog.getByLabel('홈페이지 노출').uncheck();
    await dialog.getByRole('button', { name: '저장' }).click();
    // Assert — 관리 목록(비노출 포함)
    await expect(dialog).toBeHidden();
    await expect(rowOf(page, second)).toContainText('비노출');
    const admin = (
      await adminApi<{ items: AdminStaffItem[] }>('GET', '/admin/staff')
    ).items.filter((s) => s.name.startsWith(PREFIX));
    expect(admin.find((s) => s.name === third)?.displayOrder).toBe(0);
    expect(admin.find((s) => s.name === second)?.isVisible).toBe(false);
    // Assert — 공개 응답: 비노출 제외, displayOrder asc
    const items = await publicStaff();
    expect(items.map((s) => s.name)).not.toContain(second);
    expect(items.map((s) => s.displayOrder)).toEqual([0, 0]);
    expect(items.map((s) => s.name).sort()).toEqual(
      [`${PREFIX}연출가`, third].sort()
    );
  });

  test('노출 순서가 상한(9999)을 넘으면 서버 검증 문구를 다이얼로그에 보인다', async ({
    page,
  }) => {
    // Arrange
    await page.goto('/staff');
    await page.getByRole('button', { name: '연출진 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '연출진 추가' });
    await dialog.getByPlaceholder('이름 입력').fill(`${PREFIX}상한 초과`);
    await dialog.getByPlaceholder('예: 예술감독 · 연출').fill('연출');
    await dialog.getByLabel('노출 순서').fill('10000');
    // Act
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert — 400 COMMON_001 서버 message
    await expect(
      dialog.getByText('노출 순서는 0~9999 사이 정수여야 합니다.')
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('다른 곳에서 삭제된 연출진을 저장하면 서버 STF_001 문구를 보인다', async ({
    page,
  }) => {
    // Arrange
    const name = `${PREFIX}먼저 삭제됨`;
    const created = await createStaff({ name, role: '조명' });
    await page.goto('/staff');
    await rowOf(page, name)
      .getByRole('button', { name: '연출진 수정' })
      .click();
    const dialog = page.getByRole('dialog', { name: '연출진 수정' });
    await adminApi('DELETE', `/admin/staff/${created.id}`);
    // Act
    await dialog.getByRole('button', { name: '저장' }).click();
    // Assert
    await expect(
      dialog.getByText('연출진 정보를 찾을 수 없습니다.')
    ).toBeVisible();
  });

  test('삭제 확인에서 삭제하면 목록과 공개 응답에서 사라진다', async ({
    page,
  }) => {
    // Arrange
    const name = `${PREFIX}삭제 대상`;
    await createStaff({ name, role: '음향', displayOrder: 5 });
    await page.goto('/staff');
    expect((await publicStaff()).map((s) => s.name)).toContain(name);
    // Act
    await rowOf(page, name)
      .getByRole('button', { name: '연출진 삭제' })
      .click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText(`${name}을(를) 삭제하시겠습니까?`);
    await confirm.getByRole('button', { name: '삭제' }).click();
    // Assert
    await expect(confirm).toBeHidden();
    await expect(rowOf(page, name)).toHaveCount(0);
    expect((await publicStaff()).map((s) => s.name)).not.toContain(name);
  });
});
