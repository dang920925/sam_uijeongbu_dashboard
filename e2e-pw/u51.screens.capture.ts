// ----------------------------------------------------------------------
// (U51) 시안 대조용 캡처 — `PW_PORT=3251 pnpm exec playwright test --project=setup --project=capture u51.screens`.
// SCR-D14 '캐스트 사진' 카드(위치 조정됨 · 팀샷 4:3) + '보이는 위치 조정' 창(배역 다시 조정 · 올린 직후 · 썸네일 · 팀샷).
// xs 390 · lg 1440. 사진은 브라우저 canvas 로 그린 자리표시 도형(사람 모양 — 시안 u51-crop.js 와 같은 구도, 실데이터 아님).
// ----------------------------------------------------------------------
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { test, type APIRequestContext, type Page } from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';
import { U48_PREFIX, seedU48 } from '@/e2e-pw/support/u48-seed';

const OUT = resolve(
  process.env.SCREEN_DIR ??
    '../../output/sam-uijeongbu/front-end-screens/dashboard'
);
const VIEWPORTS = {
  lg: { width: 1440, height: 900 },
  xs: { width: 390, height: 844 },
};

/** 자리표시 사진(PNG) — role 1600×1200 한 사람 · team 1600×900 다섯 사람 */
async function drawPlaceholder(page: Page, kind: 'role' | 'team') {
  const dataUrl = await page.evaluate((k) => {
    const canvas = document.createElement('canvas');
    const w = 1600;
    const h = k === 'role' ? 1200 : 900;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    if (!c) return '';
    c.fillStyle = '#2a2622';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#4a3b22';
    c.beginPath();
    if (k === 'role') c.arc(380, 560, 560, 0, Math.PI * 2);
    else c.ellipse(800, 300, 760, 420, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#3a3530';
    c.fillRect(0, h - (k === 'role' ? 200 : 140), w, 200);
    const people =
      k === 'role'
        ? [[380, 400, 118]]
        : [
            [230, 290, 70],
            [500, 270, 74],
            [800, 250, 78],
            [1100, 270, 74],
            [1370, 290, 70],
          ];
    c.fillStyle = '#c9bba4';
    for (const [x, y, r] of people) {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(x, h, r * 1.8, h - y - r * 0.6, 0, Math.PI, 0);
      c.fill();
    }
    return canvas.toDataURL('image/png');
  }, kind);
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

async function upload(request: APIRequestContext, buffer: Buffer) {
  const ticket = await adminApi<{ signedUrl: string; publicUrl: string }>(
    request,
    'POST',
    '/admin/uploads',
    { purpose: 'CAST_PHOTO', contentType: 'image/png', size: buffer.byteLength }
  );
  await request.put(ticket.signedUrl, {
    data: buffer,
    headers: { 'content-type': 'image/png' },
  });
  return ticket.publicUrl;
}

async function noStickyHeader(page: Page) {
  await page.addStyleTag({
    content: 'header { position: static !important; }',
  });
}

async function shootCard(page: Page, name: string) {
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    await page.setViewportSize(size);
    await page.waitForTimeout(300);
    await page
      .getByTestId('cast-photos-card')
      .screenshot({ path: `${OUT}/SCR-D14-U51__${name}__${vp}.png` });
  }
}

async function shootDialog(page: Page, name: string, vp: 'lg' | 'xs') {
  await page.waitForTimeout(400);
  const dialog = page.getByTestId('photo-crop-dialog');
  await dialog.getByTestId('crop-stage').waitFor();
  if (vp === 'xs') {
    // 전체 화면 시트 — 본문 스크롤 영역을 펼쳐 끝까지 찍는다(캡처 전용)
    await page.addStyleTag({
      content:
        '[data-testid=photo-crop-dialog] .MuiDialog-paper { height: auto !important; max-height: none !important; } [data-testid=photo-crop-dialog] .MuiDialogContent-root { overflow: visible !important; } [data-testid=photo-crop-dialog] .MuiDialog-container { height: auto !important; }',
    });
    await page.waitForTimeout(200);
    await page
      .locator('[data-testid=photo-crop-dialog] .MuiDialog-paper')
      .screenshot({ path: `${OUT}/SCR-D14-U51-CROP__${name}__${vp}.png` });
    return;
  }
  await page.screenshot({
    path: `${OUT}/SCR-D14-U51-CROP__${name}__${vp}.png`,
  });
}

const openRole = (page: Page) =>
  page
    .getByTestId('cast-photos-card')
    .getByRole('button', {
      name: `에반 ${U48_PREFIX}배우1 배역 사진 위치 조정`,
    })
    .first()
    .click();

test('U51 보이는 위치 조정 캡처', async ({ page, request }) => {
  test.setTimeout(120_000);
  mkdirSync(OUT, { recursive: true });
  await resetMock(request);
  const seed = await seedU48(request);
  await page.goto(`/performances/${seed.performanceId}/cast`);
  await noStickyHeader(page);
  const role = await drawPlaceholder(page, 'role');
  const team = await drawPlaceholder(page, 'team');

  // 데이터 — 배역 사진 2(하나는 위치 조정), 단체샷 1(원본), 팀샷 A(4:3 잘라 보기)
  const size = { width: 1600, height: 1200 };
  await adminApi(
    request,
    'PUT',
    `/admin/roles/${seed.roleId}/photos/ap-${seed.first}`,
    { imageUrl: await upload(request, role), ...size }
  );
  await adminApi(
    request,
    'PATCH',
    `/admin/roles/${seed.roleId}/photos/ap-${seed.first}/display`,
    { crop: { x: 26, y: 40, zoom: 1.3 } }
  );
  await adminApi(
    request,
    'POST',
    `/admin/performances/${seed.performanceId}/group-photos`,
    { imageUrl: await upload(request, team), width: 1600, height: 900 }
  );
  const photos = await adminApi<{ teams: { teamAccountId: string }[] }>(
    request,
    'GET',
    `/admin/performances/${seed.performanceId}/cast-photos`
  );
  const teamId = photos.teams[0].teamAccountId;
  await adminApi(request, 'PUT', `/admin/team-accounts/${teamId}/photo`, {
    imageUrl: await upload(request, team),
    width: 1600,
    height: 900,
  });
  await adminApi(
    request,
    'PATCH',
    `/admin/team-accounts/${teamId}/photo/display`,
    {
      photoRatio: '4:3',
      photoCrop: { x: 50, y: 45, zoom: 1.1 },
    }
  );
  await adminApi(
    request,
    'PATCH',
    `/admin/performances/${seed.performanceId}`,
    {
      castPublic: true,
    }
  );
  await page.reload();
  await noStickyHeader(page);
  await page.getByTestId('cast-photos-card').getByText('1 / 2').waitFor();
  await shootCard(page, 'card');

  // lg — 배역 사진 다시 조정 · 팀샷
  await page.setViewportSize(VIEWPORTS.lg);
  await openRole(page);
  await shootDialog(page, 'role', 'lg');
  await page.keyboard.press('Escape');
  await page
    .getByTestId('cast-photos-card')
    .getByRole('button', { name: 'A팀 팀샷 보이는 비율·위치 조정' })
    .click();
  await shootDialog(page, 'team', 'lg');
  await page.keyboard.press('Escape');

  // xs — 올린 직후(파일 선택 → 자동 열림 · 가운데)
  await page.setViewportSize(VIEWPORTS.xs);
  await page
    .locator(
      `input[type=file][aria-label="에반 ${U48_PREFIX}배우2 사진 올리기"]`
    )
    .setInputFiles({
      name: 'fixture-u51.png',
      mimeType: 'image/png',
      buffer: role,
    });
  await shootDialog(page, 'role-new', 'xs');
  await page.reload();
  await noStickyHeader(page);

  // xs — 확대 200% + 흐림 경고 없음 확인용 다시 조정, 썸네일 따로
  await openRole(page);
  const dialog = page.getByTestId('photo-crop-dialog');
  await dialog.getByRole('group', { name: /카드 3:4 보이는 위치/ }).focus();
  for (let i = 0; i < 7; i += 1) await page.keyboard.press('+');
  await shootDialog(page, 'role-zoom', 'xs');
  await page.reload();
  await noStickyHeader(page);
  await openRole(page);
  await dialog.getByRole('button', { name: '썸네일 ○ 자동' }).click();
  for (let i = 0; i < 5; i += 1)
    await dialog.getByRole('button', { name: '확대', exact: true }).click();
  await shootDialog(page, 'role-thumb', 'xs');
  await page.reload();
  await noStickyHeader(page);
  await page
    .getByTestId('cast-photos-card')
    .getByRole('button', { name: 'A팀 팀샷 보이는 비율·위치 조정' })
    .click();
  await shootDialog(page, 'team', 'xs');
});
