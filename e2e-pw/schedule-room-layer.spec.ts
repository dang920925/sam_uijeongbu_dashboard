// ----------------------------------------------------------------------
// SCR-D08 일정 캘린더 '연습실 예약' 레이어(v1.3.1 사용자 요청 — design §13) — 월·주·목록에 팀 연습실 예약이 빗금 칩으로
// 함께 보이고(기본 켜짐), 토글로 끄고 켤 수 있으며, 누르면 상세(팀·시간·메모) → '예약 삭제'(확인)가 된다.
// 연습실 예약은 목 전용 `POST /__mock/room-reservations` 로 넣는다(팀 화면은 홈페이지 몫). 접두사 fixture-room-layer-.
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const TEAM = 'Dear-B';
const MEMO = 'fixture-room-layer-메모';

/** KST 오늘 + n 일 'YYYY-MM-DD' */
function kstDate(days: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(Date.now() + days * 86400000)
  );
}

const chip = (page: Page) =>
  page
    .getByRole('button', { name: new RegExp(`연습실 예약 ${TEAM} 연습실`) })
    .filter({ visible: true });

test.describe('SCR-D08 연습실 예약 레이어', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('월·주·목록에 빗금 칩으로 보이고 토글로 끄고 켠다 · 상세에서 예약 삭제', async ({
    page,
    request,
  }, testInfo) => {
    // 오늘 19:00~21:00 KST — 월(이번 달)·주(이번 주)·목록(30일) 범위에 모두 든다
    const today = kstDate(0);
    await adminApi(request, 'POST', '/__mock/room-reservations', {
      startAt: `${today}T19:00:00+09:00`,
      endAt: `${today}T21:00:00+09:00`,
      teamName: TEAM,
      memo: MEMO,
      performanceTitle: '[작품 제목]',
    });
    await page.goto('/schedules');
    const toggle = page.getByTestId('room-layer-toggle');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    // 월(xs 는 아젠다) — 칩 글자 "Dear-B 연습실" · 빗금 무늬
    await expect(chip(page).first()).toBeVisible();
    await expect(chip(page).first()).toContainText(`${TEAM} 연습실`);
    // 빗금 무늬 — md↑ 월 격자 칩(xs 는 아젠다 줄이라 왼쪽 막대만)
    if (testInfo.project.name === 'desktop') {
      const bgImage = await chip(page)
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundImage);
      expect(bgImage).toContain('repeating-linear-gradient');
    }

    // 토글 끄기 → 사라짐, 켜기 → 다시
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(chip(page)).toHaveCount(0);
    await toggle.click();
    await expect(chip(page).first()).toBeVisible();

    // 주 보기(desktop — xs 에는 주 보기가 없다)
    if (testInfo.project.name === 'desktop') {
      await page.getByRole('button', { name: '주', exact: true }).click();
      await expect(chip(page).first()).toBeVisible();
    }
    // 목록 보기 — 다가오는 연습실 예약
    await page.getByRole('button', { name: '목록', exact: true }).click();
    const list = page.getByTestId('schedule-room-list');
    await expect(list).toBeVisible();
    await expect(list).toContainText(`${TEAM} 연습실`);

    // 상세 → 예약 삭제
    await list.getByRole('button').first().click();
    const detail = page.getByTestId('room-reservation-detail');
    await expect(detail).toContainText(TEAM);
    await expect(detail).toContainText('19:00 – 21:00');
    await expect(detail).toContainText(MEMO);
    await page.getByRole('button', { name: '예약 삭제' }).click();
    await page
      .getByRole('alertdialog', { name: '이 연습실 예약을 삭제하시겠습니까?' })
      .getByRole('button', { name: '예약 삭제' })
      .click();
    await expect(page.getByText('연습실 예약을 삭제했습니다.')).toBeVisible();
    await expect(list).toContainText('다가오는 연습실 예약이 없습니다.');
  });

  test('연습실 예약 칩 글자는 빗금 두 색 모두에 AA(4.5:1) 이상이다', async ({
    page,
    request,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'xs 는 아젠다 줄(빗금 칩 없음)'
    );
    const today = kstDate(0);
    await adminApi(request, 'POST', '/__mock/room-reservations', {
      startAt: `${today}T10:00:00+09:00`,
      endAt: `${today}T11:00:00+09:00`,
      teamName: TEAM,
    });
    await page.goto('/schedules');
    await expect(chip(page).first()).toBeVisible();
    const ratios = await chip(page)
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        const rgb = (s: string) =>
          (s.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
        const lum = ([r, g, b]: number[]) => {
          const f = (c: number) => {
            const v = c / 255;
            return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const fg = lum(rgb(cs.color));
        const stops = [...cs.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(
          (m) => lum(rgb(m[0]))
        );
        return stops.map((bg) => {
          const [hi, lo] = fg > bg ? [fg, bg] : [bg, fg];
          return (hi + 0.05) / (lo + 0.05);
        });
      });
    expect(ratios.length).toBeGreaterThan(0);
    for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
