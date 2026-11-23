// ----------------------------------------------------------------------
// (U51) 캐스트 사진 '보이는 비율 + 위치 조정' E2E(목 백엔드, back-end §27).
// - 배역 사진: 올린 직후 창 자동 열림(안내) → 키보드(화살표·Shift·+)로 옮기고 확대 → 저장 → 'PATCH …/display' 값 · '위치 조정됨'.
//   썸네일 따로 맞추기 → 자동으로 되돌리기. [위치 조정]으로 다시 열기, Esc = 저장 없이 닫기.
// - 배역 카드 비율(공연 하나) 바꾸기 → PUT cast-card-ratio.
// - 팀샷: 비율 칩(4:3) → 끌어서 옮기기(desktop) → 저장 → photoRatio·photoCrop, 타일 "4:3로 잘라 보여요".
// - 올리기 요청에 축소 후 width·height 가 실린다. 접두사 fixture-u48-(U48 시드 재사용).
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import { adminApi, pngFile, resetMock } from '@/e2e-pw/support/mock-api';
import { U48_PREFIX as PREFIX, seedU48 } from '@/e2e-pw/support/u48-seed';

interface Crop {
  x: number;
  y: number;
  zoom: number;
}
interface CastPhotosBody {
  castCardRatio: string;
  teams: {
    teamAccountId: string;
    photoRatio: string | null;
    photoCrop: Crop | null;
    photoWidth: number | null;
  }[];
  rolePhotos: {
    actorProfileId: string;
    width: number | null;
    height: number | null;
    crop: Crop | null;
    thumbCrop: Crop | null;
  }[];
}

const card = (page: Page) => page.getByTestId('cast-photos-card');
const dialog = (page: Page) => page.getByTestId('photo-crop-dialog');
const fileInput = (page: Page, label: string) =>
  page.locator(`input[type=file][aria-label="${label}"]`);

test.describe('U51 보이는 비율 + 위치 조정', () => {
  let performanceId = '';
  let second = '';

  const photos = (page: Page) =>
    adminApi<CastPhotosBody>(
      page.request,
      'GET',
      `/admin/performances/${performanceId}/cast-photos`
    );

  test.beforeEach(async ({ request, page }) => {
    await resetMock(request);
    ({ performanceId, second } = await seedU48(request));
    await page.goto(`/performances/${performanceId}/cast`);
    await expect(card(page)).toBeVisible();
  });

  test('배역 사진을 올리면 창이 열리고, 키보드로 위치·확대를 정해 저장한다', async ({
    page,
  }) => {
    await fileInput(page, `에반 ${PREFIX}배우2 사진 올리기`).setInputFiles(
      pngFile(`${PREFIX}crop.png`)
    );
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page).getByText(/사진을 올렸어요/)).toBeVisible();
    // 올리기 요청에 축소 후 크기(2×3 픽스처)가 실렸다
    await expect
      .poll(async () => (await photos(page)).rolePhotos[0]?.width)
      .toBe(2);

    const frame = dialog(page).getByRole('group', {
      name: /카드 3:4 보이는 위치/,
    });
    await frame.focus();
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await page.keyboard.press('Shift+ArrowUp');
    await expect(
      dialog(page).getByText('확대 120%', { exact: false }).first()
    ).toBeVisible();
    // 2×3 픽스처는 잘린 가로가 600px 보다 작다 → 흐림 경고(저장은 막지 않음)
    await expect(
      dialog(page).getByText(/흐릿하게 보일 수 있어요/)
    ).toBeVisible();
    await dialog(page).getByRole('button', { name: '저장' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(
      page.getByText('보이는 위치를 저장했어요').first()
    ).toBeVisible();
    await expect(card(page).getByText('배역 사진 · 위치 조정됨')).toBeVisible();
    const saved = (await photos(page)).rolePhotos.find(
      (p) => p.actorProfileId === `ap-${second}`
    );
    expect(saved?.crop?.zoom).toBe(1.2);
    expect(saved?.crop?.y).toBeLessThan(50);
    expect(saved?.thumbCrop).toBeNull();
  });

  test('[위치 조정]으로 다시 열어 썸네일을 따로 맞추고, Esc 는 저장하지 않는다', async ({
    page,
  }) => {
    await fileInput(page, `에반 ${PREFIX}배우2 사진 올리기`).setInputFiles(
      pngFile(`${PREFIX}thumb.png`)
    );
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(card(page).getByText('배역 사진 · 가운데')).toBeVisible();

    await card(page)
      .getByRole('button', { name: `에반 ${PREFIX}배우2 배역 사진 위치 조정` })
      .filter({ visible: true })
      .first()
      .click();
    await expect(dialog(page).getByText(/사진을 올렸어요/)).toBeHidden();
    await dialog(page).getByRole('button', { name: '썸네일 ○ 자동' }).click();
    await dialog(page)
      .getByRole('button', { name: '확대', exact: true })
      .click();
    const auto = dialog(page).getByRole('button', {
      name: '썸네일을 카드에 맞추기(자동)',
    });
    await expect(auto).toBeVisible();
    await dialog(page).getByRole('button', { name: '저장' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect
      .poll(async () => (await photos(page)).rolePhotos[0]?.thumbCrop?.zoom)
      .toBe(1.1);
  });

  test('배역 카드 비율을 바꾸면 공연 전체에 저장된다', async ({ page }) => {
    await card(page)
      .getByRole('group', { name: '배역 카드 비율' })
      .getByRole('button', { name: '1:1' })
      .click();
    await expect(
      page.getByText('배역 카드 비율을 바꿨어요').first()
    ).toBeVisible();
    expect((await photos(page)).castCardRatio).toBe('1:1');
    await expect(
      card(page)
        .getByRole('group', { name: '배역 카드 비율' })
        .getByRole('button', { name: '1:1' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('팀샷은 보이는 비율을 고르고 끌어서 위치를 정한다', async ({
    page,
    isMobile,
  }) => {
    await fileInput(page, 'A팀 사진 올리기').setInputFiles(
      pngFile(`${PREFIX}team.png`)
    );
    await expect(dialog(page)).toBeVisible();
    // 기본 '원본' — 틀 없이 원본 전체
    await expect(dialog(page).getByTestId('crop-frame')).toHaveCount(0);
    await dialog(page)
      .getByRole('group', { name: '보이는 비율' })
      .getByRole('button', { name: '16:9' })
      .click();
    const frame = dialog(page).getByTestId('crop-frame');
    await expect(frame).toBeVisible();
    if (isMobile) {
      await frame.focus();
      await page.keyboard.press('Shift+ArrowDown');
    } else {
      const stage = dialog(page).getByTestId('crop-stage');
      const box = await stage.boundingBox();
      if (!box) throw new Error('무대가 없습니다');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        box.x + box.width / 2,
        box.y + box.height / 2 + box.height * 0.2,
        { steps: 4 }
      );
      await page.mouse.up();
    }
    await dialog(page).getByRole('button', { name: '저장' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(card(page).getByText('16:9로 잘라 보여요')).toBeVisible();
    const team = (await photos(page)).teams[0];
    expect(team.photoRatio).toBe('16:9');
    expect(team.photoCrop?.y).toBeGreaterThan(50);
  });
});
