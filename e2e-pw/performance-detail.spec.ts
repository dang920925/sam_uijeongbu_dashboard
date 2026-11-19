// ----------------------------------------------------------------------
// SCR-D04 공연 상세·반 관리(FN-09·FN-10) — 정보 카드(KST 등록일·노출·상세 이미지 수), 404,
// 반 충돌(사전 경고·요일 비활성·서버 409 CLS_002 문구), 마감일 지난 반·비활성 반과는 충돌 없음,
// 반 수정·삭제(ConfirmDialog), 공연 수정(공용 다이얼로그), ← 뒤로.
// desktop 은 표, mobile 은 카드 — 보이는 요소만 골라 같은 테스트로 돈다.
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-1-w2-';

interface Created {
  id: string;
}

function kstDate(offsetDays = 0): string {
  const time = Date.now() + offsetDays * 24 * 60 * 60 * 1000;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(time)
  );
}

async function createPerformance(
  request: APIRequestContext,
  title: string
): Promise<Created> {
  return adminApi<Created>(request, 'POST', '/admin/performances', {
    title,
    type: 'MUSICAL',
    status: 'ONGOING',
    description: `${PREFIX}설명`,
    isVisible: false,
  });
}

async function createClass(
  request: APIRequestContext,
  performanceId: string,
  body: Record<string, unknown>
): Promise<Created> {
  return adminApi<Created>(
    request,
    'POST',
    `/admin/performances/${performanceId}/classes`,
    {
      name: `${PREFIX}기존반`,
      daysOfWeek: ['MON'],
      startTime: '19:00',
      endTime: '21:00',
      deadline: null,
      location: null,
      status: 'ACTIVE',
      ...body,
    }
  );
}

const visible = (page: Page, text: string) =>
  page.getByText(text, { exact: true }).filter({ visible: true }).first();

async function openAddDialog(page: Page) {
  await page.getByRole('button', { name: '반 추가' }).click();
  const dialog = page.getByRole('dialog', { name: '반 추가' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fillSlot(
  page: Page,
  name: string,
  day: string,
  start: string,
  end: string
) {
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('반 이름').fill(name);
  await dialog.getByRole('button', { name: day, exact: true }).click();
  await dialog.getByLabel('시작 시간').fill(start);
  await dialog.getByLabel('종료 시간').fill(end);
}

test.describe('SCR-D04 공연 상세·반 관리', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('공연 정보 카드에 라벨·KST 등록일·비노출·상세 이미지 수를 보이고 빈 반 문구를 보인다', async ({
    page,
    request,
  }) => {
    // Arrange
    const title = `${PREFIX}상세 공연`;
    const { id } = await createPerformance(request, title);
    // Act
    await page.goto(`/performances/${id}`);
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: title })
    ).toBeVisible();
    await expect(page.getByText('공연 상세 정보')).toBeVisible();
    await expect(visible(page, '뮤지컬')).toBeVisible();
    await expect(visible(page, '진행중')).toBeVisible();
    await expect(visible(page, kstDate().replaceAll('-', '.'))).toBeVisible();
    await expect(visible(page, '비노출')).toBeVisible();
    await expect(visible(page, '0장')).toBeVisible();
    await expect(visible(page, `${PREFIX}설명`)).toBeVisible();
    await expect(page.getByText('등록된 반이 없습니다')).toBeVisible();
  });

  test('없는 공연이면 "공연을 찾을 수 없습니다" 를 보인다(404 PERF_001)', async ({
    page,
  }) => {
    await page.goto('/performances/fixture-1-w2-none');
    await expect(page.getByText('공연을 찾을 수 없습니다')).toBeVisible();
  });

  test('반 목록에 요일·"HH:MM ~ HH:MM"·마감일·상태를 보이고 ← 로 공연 관리로 돌아간다', async ({
    page,
    request,
  }) => {
    // Arrange
    const { id } = await createPerformance(request, `${PREFIX}목록`);
    await createClass(request, id, {
      name: `${PREFIX}A반`,
      daysOfWeek: ['WED', 'MON'],
      deadline: '2030-01-31',
    });
    // Act
    await page.goto(`/performances/${id}`);
    // Assert
    await expect(visible(page, `${PREFIX}A반`)).toBeVisible();
    await expect(visible(page, '월, 수')).toBeVisible();
    await expect(visible(page, '19:00 ~ 21:00')).toBeVisible();
    await expect(
      page.getByText('2030.01.31').filter({ visible: true })
    ).toHaveCount(1);
    await expect(visible(page, '활성')).toBeVisible();
    await page.getByRole('link', { name: '공연 관리로 돌아가기' }).click();
    await expect(page).toHaveURL(/\/performances$/);
  });

  test('월 19:00~21:00 반이 있으면 월 20:00~22:00 은 경고하고 추가를 막는다(다른 공연의 반도 본다)', async ({
    page,
    request,
  }) => {
    // Arrange — 충돌 상대는 다른 공연의 반
    const other = await createPerformance(request, `${PREFIX}다른 공연`);
    await createClass(request, other.id, {});
    const { id } = await createPerformance(request, `${PREFIX}새 공연`);
    await page.goto(`/performances/${id}`);
    const dialog = await openAddDialog(page);
    // Act
    await fillSlot(page, `${PREFIX}B반`, '월', '20:00', '22:00');
    // Assert
    await expect(
      dialog.getByText('선택한 요일/시간에 이미 운영 중인 반이 있습니다')
    ).toBeVisible();
    await expect(dialog.getByRole('button', { name: '추가' })).toBeDisabled();
    // 현행 로직: 선택이 이미 겹치면 나머지 미선택 요일이 전부 비활성
    await expect(
      dialog.getByRole('button', { name: '화', exact: true })
    ).toBeDisabled();
    await expect(
      dialog.getByRole('button', { name: '월', exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('화면이 모르는 사이 생긴 반과 겹치면 서버 409 CLS_002 문구를 다이얼로그 안에 보인다', async ({
    page,
    request,
  }) => {
    // Arrange — 화면을 연 뒤에 충돌 반을 만든다(사전 경고 캐시에는 없음)
    const { id } = await createPerformance(request, `${PREFIX}409`);
    await page.goto(`/performances/${id}`);
    await expect(page.getByText('등록된 반이 없습니다')).toBeVisible();
    await createClass(request, id, {});
    const dialog = await openAddDialog(page);
    await fillSlot(page, `${PREFIX}C반`, '월', '20:00', '22:00');
    // Act
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert
    await expect(
      dialog.getByText('선택한 요일/시간에 이미 다른 반이 있습니다')
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('기존 반 마감일이 어제면 같은 시간이라도 경고 없이 추가된다', async ({
    page,
    request,
  }) => {
    // Arrange
    const { id } = await createPerformance(request, `${PREFIX}마감`);
    await createClass(request, id, {
      name: `${PREFIX}지난반`,
      deadline: kstDate(-1),
    });
    await page.goto(`/performances/${id}`);
    const dialog = await openAddDialog(page);
    // Act
    await fillSlot(page, `${PREFIX}D반`, '월', '19:00', '21:00');
    await expect(
      dialog.getByText('선택한 요일/시간에 이미 운영 중인 반이 있습니다')
    ).toHaveCount(0);
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert
    await expect(dialog).toBeHidden();
    await expect(visible(page, `${PREFIX}D반`)).toBeVisible();
  });

  test('비활성 반과는 충돌하지 않는다', async ({ page, request }) => {
    // Arrange
    const { id } = await createPerformance(request, `${PREFIX}비활성`);
    await createClass(request, id, {
      name: `${PREFIX}쉬는반`,
      status: 'INACTIVE',
    });
    await page.goto(`/performances/${id}`);
    const dialog = await openAddDialog(page);
    // Act
    await fillSlot(page, `${PREFIX}E반`, '월', '20:00', '22:00');
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert
    await expect(dialog).toBeHidden();
    await expect(visible(page, `${PREFIX}E반`)).toBeVisible();
  });

  test('반 이름이 비면 기획 문구로 막고, 종료가 시작보다 이르면 CLS_003 문구를 보인다', async ({
    page,
    request,
  }) => {
    const { id } = await createPerformance(request, `${PREFIX}검증`);
    await page.goto(`/performances/${id}`);
    const dialog = await openAddDialog(page);
    await dialog.getByLabel('시작 시간').fill('21:00');
    await dialog.getByLabel('종료 시간').fill('20:00');
    await dialog.getByRole('button', { name: '추가' }).click();
    await expect(dialog.getByText('반 이름을 입력해주세요.')).toBeVisible();
    await expect(
      dialog.getByText('종료 일시는 시작 일시 이후여야 합니다.')
    ).toBeVisible();
  });

  test('반 수정 다이얼로그는 기존 값으로 열리고 저장하면 목록이 바뀐다', async ({
    page,
    request,
  }) => {
    // Arrange
    const { id } = await createPerformance(request, `${PREFIX}수정`);
    await createClass(request, id, { name: `${PREFIX}원래반` });
    await page.goto(`/performances/${id}`);
    // Act
    await page
      .getByRole('button', { name: `반 수정 ${PREFIX}원래반` })
      .filter({ visible: true })
      .click();
    const dialog = page.getByRole('dialog', { name: '반 수정' });
    await expect(dialog.getByLabel('반 이름')).toHaveValue(`${PREFIX}원래반`);
    // 자기 반과는 충돌로 보지 않는다
    await expect(
      dialog.getByText('선택한 요일/시간에 이미 운영 중인 반이 있습니다')
    ).toHaveCount(0);
    await dialog.getByLabel('반 이름').fill(`${PREFIX}바뀐반`);
    await dialog.getByRole('button', { name: '저장' }).click();
    // Assert
    await expect(dialog).toBeHidden();
    await expect(visible(page, `${PREFIX}바뀐반`)).toBeVisible();
    await expect(page.getByText('저장되었습니다')).toBeVisible();
  });

  test('반 삭제는 확인창 "반을 삭제하시겠습니까?" 를 거쳐 지운다', async ({
    page,
    request,
  }) => {
    // Arrange
    const { id } = await createPerformance(request, `${PREFIX}삭제`);
    await createClass(request, id, { name: `${PREFIX}지울반` });
    await page.goto(`/performances/${id}`);
    // Act
    await page
      .getByRole('button', { name: `반 삭제 ${PREFIX}지울반` })
      .filter({ visible: true })
      .click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm.getByText('반을 삭제하시겠습니까?')).toBeVisible();
    await confirm.getByRole('button', { name: '삭제' }).click();
    // Assert
    await expect(page.getByText('등록된 반이 없습니다')).toBeVisible();
  });

  test('공연 수정 다이얼로그는 현재 값으로 열리고 저장하면 제목이 바뀐다', async ({
    page,
    request,
  }) => {
    // Arrange
    const { id } = await createPerformance(request, `${PREFIX}수정 전`);
    await page.goto(`/performances/${id}`);
    // Act
    await page.getByRole('button', { name: '수정', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '공연 수정' });
    await expect(dialog.getByLabel('공연 제목')).toHaveValue(
      `${PREFIX}수정 전`
    );
    await dialog.getByLabel('공연 제목').fill(`${PREFIX}수정 후`);
    await dialog.getByRole('button', { name: '저장' }).click();
    // Assert
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole('heading', { level: 1, name: `${PREFIX}수정 후` })
    ).toBeVisible();
  });
});
