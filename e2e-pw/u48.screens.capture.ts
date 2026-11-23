// ----------------------------------------------------------------------
// (U48) 시안 대조용 캡처 — `PW_PORT=3225 pnpm exec playwright test --project=setup --project=capture u48.screens`.
// SCR-D14 '캐스트 사진' 카드: 사진 있음(공개 켜짐) · 사진 없음(공개 꺼짐) · 업로드 실패 / SCR-D11 출연 팀 열.
// xs 390 · lg 1440. 데이터는 목 백엔드 fixture-u48- 픽스처(회색 자리 이미지).
// ----------------------------------------------------------------------
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { test, type Page } from '@playwright/test';

import {
  adminApi,
  pngFile,
  resetMock,
  uploadFixtureImage,
} from '@/e2e-pw/support/mock-api';
import { U48_PREFIX, seedU48 } from '@/e2e-pw/support/u48-seed';

const OUT = resolve(
  process.env.SCREEN_DIR ??
    '../../output/sam-uijeongbu/front-end-screens/dashboard'
);
const VIEWPORTS = {
  lg: { width: 1440, height: 900 },
  xs: { width: 390, height: 844 },
};

async function shootCard(page: Page, name: string) {
  // 고정 헤더가 카드 위를 덮지 않게(캡처 전용)
  await page.addStyleTag({
    content: 'header { position: static !important; }',
  });
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    await page.setViewportSize(size);
    await page.waitForTimeout(300);
    await page
      .getByTestId('cast-photos-card')
      .screenshot({ path: `${OUT}/SCR-D14-U48__${name}__${vp}.png` });
  }
}

test('U48 캐스트 사진 카드 캡처', async ({ page, request }) => {
  mkdirSync(OUT, { recursive: true });

  // 사진 없음 + 공개 꺼짐
  await resetMock(request);
  const seed = await seedU48(request);
  await page.goto(`/performances/${seed.performanceId}/cast`);
  await page.getByTestId('cast-photos-card').getByText('0 / 2').waitFor();
  await shootCard(page, 'empty-private');

  // 업로드 실패(저장 500) + 올린 것 일부
  await adminApi(request, 'POST', '/__mock/fault', {
    method: 'PUT',
    pattern: '^/v1/admin/roles/.*/photos/',
    status: 500,
    count: 1,
  });
  await page
    .locator(
      `input[type=file][aria-label="에반 ${U48_PREFIX}배우2 사진 올리기"]`
    )
    .setInputFiles(pngFile('fixture-u48-fail.png'));
  await page.getByTestId('cast-photos-card').getByRole('alert').waitFor();
  await shootCard(page, 'upload-failed');
  await request.post('/api/backend/v1/__mock/fault/clear');

  // 사진 있음 + 공개 켜짐
  const url = () => uploadFixtureImage(request, 'CAST_PHOTO');
  for (let i = 0; i < 3; i += 1) {
    await adminApi(
      request,
      'POST',
      `/admin/performances/${seed.performanceId}/group-photos`,
      { imageUrl: await url() }
    );
  }
  const photos = await adminApi<{ teams: { teamAccountId: string }[] }>(
    request,
    'GET',
    `/admin/performances/${seed.performanceId}/cast-photos`
  );
  for (const team of photos.teams) {
    await adminApi(
      request,
      'PUT',
      `/admin/team-accounts/${team.teamAccountId}/photo`,
      {
        imageUrl: await url(),
      }
    );
  }
  for (const memberId of [seed.first, seed.second]) {
    await adminApi(
      request,
      'PUT',
      `/admin/roles/${seed.roleId}/photos/ap-${memberId}`,
      { imageUrl: await url() }
    );
  }
  await adminApi(
    request,
    'PATCH',
    `/admin/performances/${seed.performanceId}`,
    {
      castPublic: true,
    }
  );
  await page.reload();
  await page.getByTestId('cast-photos-card').getByText('2 / 2').waitFor();
  await shootCard(page, 'filled-public');

  // SCR-D11 출연 팀 열 + 머리 미리보기 버튼
  await page.goto(`/performances/${seed.performanceId}/shows`);
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    await page.setViewportSize(size);
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${OUT}/SCR-D11-U48__team__${vp}.png`,
      fullPage: true,
    });
  }
});
